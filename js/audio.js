"use strict";

class GameAudio {
  constructor(){
    this.context = null;
    this.musicEnabled = false;
    this.effectsEnabled = false;
    this.effectsGain = null;
    this.musicBuffer = null;
    this.musicSource = null;
    this.musicGain = null;
    this.toggling = new Set();
    document.addEventListener("visibilitychange",()=>{
      if(document.hidden)this.stopMusic();
      else if(this.musicEnabled)this.startMusic();
    });
  }
  async toggle(channel){
    const property=channel==="music"?"musicEnabled":"effectsEnabled";
    if(this.toggling.has(channel))return this[property];
    if(this[property]){
      this[property]=false;
      if(channel==="music")this.stopMusic();
      else this.effectsGain.gain.setValueAtTime(0,this.context.currentTime);
      return false;
    }
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if(!AudioContextClass){
      throw new Error("เบราว์เซอร์นี้ไม่รองรับ Web Audio เกมยังเล่นได้โดยไม่มีเสียง");
    }
    this.toggling.add(channel);
    try{
      if(!this.context) this.context = new AudioContextClass();
      await this.context.resume();
      if(this.context.state!=="running"){
        throw new Error("เปิดเสียงไม่ได้ กรุณาลองอีกครั้ง เกมยังเล่นได้ตามปกติ");
      }
      if(channel==="music"){
        if(!this.musicBuffer)this.musicBuffer=this.composeMusic();
        this.musicEnabled=true;
        this.startMusic();
      }else{
        if(!this.effectsGain){
          this.effectsGain=this.context.createGain();
          this.effectsGain.connect(this.context.destination);
        }
        this.effectsGain.gain.setValueAtTime(1,this.context.currentTime);
        this.effectsEnabled=true;
      }
      return true;
    }finally{
      this.toggling.delete(channel);
    }
  }
  composeMusic(){
    // Original 16-bar daytime theme, rendered once rather than scheduled each frame.
    const rate=22050,beat=60/112,bar=beat*4;
    const melody=[
      [76,79,81,79,74,76,72,74],[76,0,79,76,74,72,69,72],
      [74,77,81,77,76,74,71,74],[72,76,79,0,77,76,74,0],
      [81,84,83,79,76,79,81,0],[79,76,74,72,69,72,76,0],
      [77,81,79,77,74,77,76,74],[76,74,72,0,67,69,71,74],
      [84,83,79,81,79,76,74,76],[81,79,76,72,74,76,79,0],
      [81,77,74,77,79,81,83,0],[79,76,72,74,76,79,77,76],
      [81,79,76,79,84,83,81,79],[76,74,72,69,72,74,76,0],
      [77,74,71,74,79,77,74,71],[72,0,76,0,79,0,71,0]
    ];
    const chords=[[48,52,55],[45,48,52],[50,53,57],[43,47,50]];
    const buffer=this.context.createBuffer(1,Math.round(bar*melody.length*rate),rate);
    const data=buffer.getChannelData(0);
    const note=(midi,start,duration,volume,voice)=>{
      const frequency=440*Math.pow(2,(midi-69)/12),first=Math.round(start*rate);
      const count=Math.min(Math.round(duration*rate),data.length-first);
      for(let i=0;i<count;i++){
        const t=i/rate,phase=2*Math.PI*frequency*t;
        const envelope=Math.min(1,t/.012)*Math.min(1,(count-i)/(rate*.055));
        const wave=voice==="lead"?(Math.sin(phase)+.24*Math.sin(phase*2)+.12*Math.sin(phase*3)):
          voice==="bass"?Math.sin(phase):Math.asin(Math.sin(phase))*2/Math.PI;
        data[first+i]+=wave*volume*envelope*Math.exp(-t*(voice==="pad"?.5:2.3));
      }
    };
    for(let measure=0;measure<melody.length;measure++){
      const start=measure*bar,chord=chords[measure%4];
      melody[measure].forEach((midi,step)=>{
        if(midi)note(midi,start+step*beat/2,beat*.46,.12,"lead");
        note(chord[step%3]+12,start+step*beat/2,beat*.38,.025,"pad");
      });
      chord.forEach(midi=>note(midi+12,start,bar-.06,.027,"pad"));
      for(let pulse=0;pulse<4;pulse++){
        note(chord[pulse%2===0?0:2]-12,start+pulse*beat,beat*.7,.11,"bass");
        const first=Math.round((start+pulse*beat)*rate);
        for(let i=0;i<rate*.07;i++){
          const t=i/rate;
          data[first+i]+=Math.sin(2*Math.PI*(90*t-350*t*t))*.055*Math.exp(-t*65);
        }
      }
    }
    return buffer;
  }
  startMusic(){
    if(this.musicSource||!this.musicEnabled||document.hidden)return;
    const source=this.context.createBufferSource(),gain=this.context.createGain();
    source.buffer=this.musicBuffer;source.loop=true;gain.gain.value=.55;
    source.connect(gain);gain.connect(this.context.destination);
    source.onended=()=>{source.disconnect();gain.disconnect();};
    this.musicSource=source;this.musicGain=gain;source.start();
  }
  stopMusic(){
    if(!this.musicSource)return;
    const now=this.context.currentTime,source=this.musicSource,gain=this.musicGain;
    gain.gain.setValueAtTime(gain.gain.value,now);
    gain.gain.linearRampToValueAtTime(0,now+.04);source.stop(now+.05);
    this.musicSource=null;this.musicGain=null;
  }
  beep(freq=440,duration=.09){
    if(!this.effectsEnabled || !this.context || this.context.state!=="running") return;
    const audio = this.context;
    const oscillator = audio.createOscillator(), gain = audio.createGain();
    oscillator.type = "square"; oscillator.frequency.value = freq;
    gain.gain.setValueAtTime(.035,audio.currentTime);
    gain.gain.exponentialRampToValueAtTime(.001,audio.currentTime+duration);
    oscillator.connect(gain); gain.connect(this.effectsGain);
    oscillator.start(); oscillator.stop(audio.currentTime+duration);
    oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
  }
}
const gameAudio = new GameAudio();
