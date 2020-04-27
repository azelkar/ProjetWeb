function getRandomIntInclusive(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min +1)) + min;
  }

  const wordBase = ['Chien', 'Chat', 'Enfant', 'Oiseau', 'Ballon'];

class Player {
    constructor(name, socket){
        this.name = name;
        this.points = 0;
        this.guessedRight = false;
        this.socket = socket;
    }

    addPoints (gain){
        this.points += gain;
    }

}

class Rules {
    constructor(timer, words, rounds){
        this.timer = timer;
        this.words = words;
        this.rounds = rounds;
    }
}

class Game {
    constructor(id, rules){
		this.id = id;
        this.rules = rules;
        this.players = [];
		this.isStarted = false;
        this.drawer = new Player;
        this.wordchoice = [];
        this.winners = []
        this.round = 1;
        this.turn = 1;
        this.selectedword = '';
        this.playerReward = 350;
    }
	reset(){
		this.round = 1;
		this.turn = 1;
		this.selectedword ='';
		this.resetGuess();
		this.isStarted = false;
		this.players.forEach((player) => {
            player.points = 0;
        });
	}

    addPlayer (socket){
        this.players.push(new Player(socket.username, socket));
    }

    setFirstDrawer (player){
        this.drawer = player;
    }

    nextDrawer (){
		this.resetGuess();
		this.playerReward = 350;
        if (this.turn < this.players.length){
            this.drawer = this.players[this.players.indexOf(this.drawer)+1]
            this.turn += 1;
        }
        else {
            this.round += 1;
            this.turn = 1;
            this.drawer = this.players[0];
        }
    }

    checkStartCondition (){
        if (this.players.length >= 2){
            this.canStart = true;
        }
    }

    setWordChoices (){
        while (this.wordchoice.length < 3){
            this.wordchoice.push(this.rules.words[getRandomIntInclusive(0,this.rules.words.length - 1)]);
        }
    }
    
    setSelectedWord (word){
        this.selectedword = word;
        this.wordchoice = [];
    }

    checkSamePlayerName (name){
        this.players.forEach(player => function(player){
            if (player.name == name){
                return true;
            }
        })
    }
	
	resetGuess(){
		this.players.forEach((player) => {
            player.guessedRight= false;
        });
	}

    compareAnswer(answer, name){
        if (this.selectedword == answer){
			this.playerGetByName(name).addPoints(this.playerReward);
            this.playerGetByName(name).guessedRight = true;
            if (this.playerReward > 50){
                this.playerReward -= 50;
            }
        }
    }
    drawerReward (){
        let counter = 0;
        this.players.forEach((player) => {
            if (player.guessedRight){
                counter += 1;
            }
        });
		console.log(this.players.length)
        if (counter > 0){
            this.drawer.addPoints(350);
        }
        if (counter == this.players.length-1){
            this.drawer.addPoints(50);
        }
    }

    playerGetByName (name){
        return this.players.find(player => player.name == name);
    }
	
	checkWin(){
		let res = true;
        this.getNotDrawer().forEach((player) => {
			console.log(player.name)
			console.log(player.guessedRight)
            if (!player.guessedRight){
                res = false;
				return;
            }
        });
		console.log('return',res)
		return res;
    }
	getNotDrawer(){
		const temp = [...this.players]
		const index = temp.indexOf(this.drawer);
		temp.splice(index, 1);
		return temp;
	}
	
	getPlayers(){
		const table = [];
		this.players.forEach((p) => {
			table.push({name: p.name, points: p.points})
		});
		return table;
	}
    
	

}








const lobbies = []
const lobby = new Game(lobbies.length,new Rules(10,wordBase,1));
lobbies.push(lobby);



const io = require('socket.io')()



const messages = [{name: 'bot', text: 'Bienvenue.'}]

io.on('connection', (client) => {

	client.on('set-name', (name) => {
		console.log('set-name ', name)
		client.username = name
		client.emit('add-messages', messages)
		client.lobby = lobbies[0];
		client.lobby.addPlayer(client);
		client.lobby.setSelectedWord('test');
		alertAll ('update-players', client.lobby.getPlayers(), client.lobby.players);
	});

	client.on('guess-word', (guessedword) => {
		if(client.lobby !== undefined){
			if(client.username != client.lobby.drawer.name){
				if (guessedword == client.lobby.selectedword && !client.lobby.playerGetByName(client.username).guessedRight){
					client.lobby.compareAnswer(guessedword, client.username);
					alertAll('add-messages', {text: client.username + ':' + ' a trouvé'}, client.lobby.players);
					if (client.lobby.checkWin()){
						newTurn (lobby);
					}
				}
				else {
				  alertAll('add-messages', {text: client.username + ':' + guessedword + ' is false'}, client.lobby.players);
				}
			}
		}
	});
	
	client.on('dragging-update', (dragging) => {
		if(client.lobby !== undefined){
			if (client.username == client.lobby.drawer.name){
				alertAll('dragging-update', dragging, client.lobby.players);
			}
		}
	});

	client.on('stroke', (e) => {
		if(client.lobby !== undefined){
			if (client.username == client.lobby.drawer.name){
				alertAll('stroke', e, client.lobby.players);
			}
		}
	});
	client.on('clear', (e) => {
		if(client.lobby !== undefined){
			if (client.username == client.lobby.drawer.name){
				alertAll('clear', null, client.lobby.players);
			}
		}
	});
	client.on('start', () => {
		if(client.lobby.players.length >= 2 && !client.lobby.isStarted){
			console.log('start')
			client.lobby.isStarted = true;
			client.lobby.setFirstDrawer(client.lobby.players[0]);
			client.lobby.setWordChoices();
			const choices = {0:lobby.wordchoice[0],1:lobby.wordchoice[1],2:lobby.wordchoice[2]}
			simpleAlert('Choose-a-word',choices,client.lobby.drawer);
			alertAll('add-messages', {text: client.lobby.drawer.name +' est le dessinateur'}, client.lobby.players);
			alertAll('add-messages', {text: client.lobby.drawer.name +' choisit un mot (les trois boutons sous le canvas)'}, client.lobby.players);
		}
	});

	client.on('choosen-word', (word) => {
		client.lobby.setSelectedWord(word);
		const dashed = '-'.repeat(word.length);
		const players = client.lobby.getNotDrawer();

		alertAll('add-messages', {text: 'le mot: ' + dashed}, players);
		
		simpleAlert('add-messages',{text: 'mot: ' + word},client.lobby.drawer);
		
		
		client.lobby.timer = client.lobby.rules.timer;
		client.lobby.interval = setInterval (Timer, 1000,client.lobby);
	});

  
  
  client.on('create-lobby',(rules) => {
	  lobby = new Game(lobbies.length,rules);
	  lobby.addPlayer(client);
	  client.lobby = lobby;
	  lobbies.push(lobby);
	  simpleAlert('new-lobby',client);
  });
  
  client.on('join-lobby', (lobbyId) => {
		const lobby = lobbies[lobbyId];
		lobby.addPlayer(client);
		client.lobby = lobbies;
		alertAll ('update-players', lobby.players, client.lobby.players);
  });
  
});
function newTurn (lobby){
	lobby.drawerReward();
	clearInterval (lobby.interval);
	alertAll ('update-players', lobby.getPlayers(), lobby.players);
	alertAll('clear', null, lobby.players);
	lobby.nextDrawer();
	if(lobby.round <= lobby.rules.rounds){
		lobby.setWordChoices();
		let choices = {0:lobby.wordchoice[0],1:lobby.wordchoice[1],2:lobby.wordchoice[2]}
		simpleAlert('Choose-a-word',choices,lobby.drawer);
		alertAll('add-messages', {text: lobby.drawer.name +' est le dessinateur'}, lobby.players);
		alertAll('add-messages', {text: lobby.drawer.name +' choisit un mot (les trois boutons sous le canvas)'}, lobby.players);
	}else{
		lobby.drawer = new Player;
		alertAll('add-messages', {text: 'Fin de la partie, appuyer sur start pour recommencer'}, lobby.players);
		lobby.reset();
		alertAll ('update-players', lobby.getPlayers(), lobby.players);
	}
}
function Timer (lobby){
  lobby.timer -= 1;
  alertAll('timer', lobby.timer, lobby.players);
  if(lobby.timer < 1){
    newTurn(lobby);
  }
}
function simpleAlert (identif, object, player){
  player.socket.emit(identif, object);
}
function alertAll (identif, object, players){
  players.forEach((player) => {
    player.socket.emit(identif, object);
  });
  
 
}


const port = 3001
io.listen(port)
console.log('socket.io listening on port ', port)






