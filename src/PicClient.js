import openSocket from 'socket.io-client';

const  socket = openSocket('http://localhost:3000');


class PicClient {

  constructor(username) {
		socket.emit('set-name', username)
  }


  onMessages(cb) {
		socket.on('add-messages', (messages) => cb(messages))
  }
  
  onRight(cb){
		socket.on('You-guessed-right',() => cb())
  }
  start(){
	  socket.emit('start',null);
  }
  onPlayerUpdate(cb){
		socket.on('update-players',(players) =>cb(players))
		console.log("update")
  }
  
  onChooseWord(cb){
	  socket.on('Choose-a-word',(words) =>cb(words))
  }

  create(rules){
	  socket.emit('create-lobby',rules);
  }
  
  start(){
	  socket.emit('start',null);
  }
  
  choice(word, hide){
	  socket.emit('choosen-word',word);
	  hide();
  }
  
  guess(word){
	  socket.emit('guess-word',word);
  }
  onStroke(cb){
	  socket.on('stroke',(e) => cb(e))
  }
  onDragging(cb){
	  socket.on('dragging-update',(draggingUpdate) => cb(draggingUpdate.dragging, draggingUpdate.event))
  }
  putPoint(e){
	  const data = {offsetX: e.offsetX, offsetY: e.offsetY}
	  socket.emit('stroke',data);
  }
  engage(e){
	  const data = {offsetX: e.offsetX, offsetY: e.offsetY}
	  socket.emit('dragging-update',{dragging: true, event:data});
  }
  disengage(e){
	  const data = {offsetX: e.offsetX, offsetY: e.offsetY}
	  socket.emit('dragging-update',{dragging: false, event:data});
  }
  
  stroke(strokeEvent){
	  socket.emit('stroke',strokeEvent);
  }
  
  join(id){
	  socket.emit('join-lobby',id);
  }
  
  clear(){
	  socket.emit('clear',null);
  }
  
  onClear(cb){
	  socket.on('clear',() => cb())
  }
  onSelected(cb){
	  socket.on('New-word',(word) => cb(word))
  }
}

export { PicClient }
