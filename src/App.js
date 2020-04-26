import React from 'react';
import { PicClient } from './PicClient';
require('./index.css');


class Canvas extends React.Component {
	constructor(props){
		super(props)
		this.state = {
			canvas:null,
			context:null,
			radius: 5,
			start: 0,
			end: Math.PI * 2, 
			dragging: false,
			hidden: true,
			word: {},
		};
		this.draggingUpdate=this.draggingUpdate.bind(this);
		this.putPoint=this.putPoint.bind(this);
		this.clearCanvas=this.clearCanvas.bind(this);
		this.setLineWidth=this.setLineWidth.bind(this);
		this.setLineColor=this.setLineColor.bind(this);
		this.picker=this.picker.bind(this);
		this.hide=this.hide.bind(this);
		
		this.socket = props.socket;
		this.socket.onDragging(this.draggingUpdate)
		this.socket.onStroke(this.putPoint);
		this.socket.onClear(this.clearCanvas);
		this.socket.onChooseWord(this.picker);
	}
	
	componentDidMount() {
		let canvas = document.getElementById('canvas');
		this.setState({canvas})
		let context = this.setupCanvas(canvas);
		this.setState({ context });
	}
  
	setupCanvas(canvas) {
		this.addListener(canvas);
		return canvas.getContext('2d');
	}
	
	addListener(canvas){
		canvas.addEventListener('mousedown', this.socket.engage);
		canvas.addEventListener('mousemove', this.socket.putPoint);
		canvas.addEventListener('mouseup', this.socket.disengage);
		canvas.addEventListener('mouseleave', this.socket.disengage);
	}
	
	picker(word){
		console.log(word)
		this.setState({
			hidden: false,
			word: word
		})
	}
	
	putPoint(e){
		if(this.state.dragging){
			let context = this.state.context;
			context.lineTo(e.offsetX, e.offsetY);
			context.lineWidth = this.state.radius * 2;
			context.stroke();
			context.beginPath(); 
			context.arc(e.offsetX, e.offsetY, this.state.radius, this.state.start, this.state.end);
			context.fill();
			context.beginPath();
			context.moveTo(e.offsetX, e.offsetY);
		}
	}
	
	draggingUpdate(isDragging, e){
		if(isDragging){
			this.setState({dragging: isDragging});
			this.putPoint(e);
		}else{
			this.setState({dragging: isDragging});
			let context = this.state.context;
			context.beginPath();
		}
	}

	clearCanvas()
	{
		let context = this.state.context;
		context.clearRect(0, 0, this.state.canvas.width, this.state.canvas.height);
	}

	setLineWidth (multiplicator){
		let radius = multiplicator
		this.state.context.lineWidth = radius * 2;
	}

	setLineColor (color){
		let context = this.state.context;
		context.strokeStyle = color;
		context.setLineColor = color;
		context.fillStyle = color;
	}
	hide(){
		this.setState({
			hidden: true,
		})
	}
	
	render() {
		const words = [];
		if(!this.state.hidden){
			words.push(<button  onClick={() => this.socket.choice(this.state.word[0],this.hide)} >{this.state.word[0]}</button>)
			words.push(<button  onClick={() => this.socket.choice(this.state.word[1],this.hide)} >{this.state.word[1]}</button>)
			words.push(<button  onClick={() => this.socket.choice(this.state.word[2],this.hide)} >{this.state.word[2]}</button>)
		}
		return (
		  <div>
			<div className='button-bar'>
			  <button onClick={() => this.socket.clear()}>Clear all</button>
			  <button onClick={() => this.socket.start()}>Start</button>
			</div>
			<canvas id="canvas" width="500" height="500" style={{border: "1px solid black"}}/>
			<div>
			{words}
			</div>
		  </div>
		);
	}
}

class PlayerList extends React.Component{
	constructor(props) {
		super(props)
		this.state = {players:[]}
		this.socket = this.props.socket;
		this.update = this.update.bind(this)
		
		this.socket.onPlayerUpdate(this.update)
	}
  
	update(playersUpdate){
		this.setState(() => ({
			players: playersUpdate
		}))
	}
	
	render(){
		const players = this.state.players.map((p) => <div><div> {p.name}</div> <div>{p.points} </div></div>)
		return(<ul class="players">
          {players}
        </ul>);
	}
}

class InputField extends React.Component {
  constructor() {
    super()
    this.state = {value: ""}
    this.handleChange = this.handleChange.bind(this)
    this.handleSubmit = this.handleSubmit.bind(this)
  }

  handleChange(event) {
    if(this.props.onChange) this.props.onChange(event.target.value)
    this.setState({value: event.target.value})
  }

  handleSubmit(event) {
    if(this.props.onSubmit) this.props.onSubmit(this.state.value)
    this.setState({value: ""})
    event.preventDefault()
  }

  render() {
    return (<form onSubmit={this.handleSubmit}>
        <label>{this.props.label} </label>
        <input type="text" onChange={this.handleChange} value={this.state.value} autoFocus={this.props.autoFocus} />
      </form>)
  }
}



class LoginWindow extends React.Component {
  render() {
    return <div>
    <h1>Pictionnary</h1>
    <InputField label="Nom" onChange={this.props.onNameChange} onSubmit={this.props.onLogin} autoFocus />
    <button onClick={this.props.onLogin}>Rejoindre</button>
    </div>
  }
}



class ChatWindow extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
		messages: [],
		right: false,
	}
    this.submitGuess = this.submitGuess.bind(this)
    this.addMessages = this.addMessages.bind(this)
    this.right = this.right.bind(this)

    this.socket = this.props.socket;
    this.socket.onMessages(this.addMessages)
	this.socket.onRight(this.right)
  }

  addMessages(messages) {
    this.setState((state, props) => ({
      messages: state.messages.concat(messages)
    }))
  }
  right(){
	  this.setState({right: true})
  }

  submitGuess(word) {
	  if(!this.state.right)
		this.socket.guess(word)
  }

  render() {
    const messages = this.state.messages.map((m) => <li> {m.text} </li>)
    return (
      <div>
        <h1>Messages</h1>
        Pseudo : {this.props.name}
		<ul class="message">
          {messages}
        </ul>
        <InputField label="Message" onSubmit={this.submitGuess} autoFocus />
      </div>
    );
  }
}



class App extends React.Component {
  constructor() {
    super()
    this.state = {name: "", current: "login"}

    this.startLobby = this.startLobby.bind(this)
    this.setName = this.setName.bind(this)
  }

  startLobby() {
    this.setState({current: "lobby"})
	const socket = new PicClient(this.state.name)
	this.setState({socket})
  }

  setName(name) {
    this.setState({name: name})
  }

  render() {
    if(this.state.current === "login") 
      return <LoginWindow onNameChange={this.setName} onLogin={this.startLobby} />
    else
      return (
			<ul id="main">
				<li>
					<PlayerList socket={this.state.socket}/>
				</li>
				<li>
					<Canvas socket={this.state.socket}/>
				</li>
				<li>
					<ChatWindow name={this.state.name} socket={this.state.socket}/>
				</li>
			</ul>);
  }
}

export default App;