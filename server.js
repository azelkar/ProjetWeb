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
        this.isDrawer = false;
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
        this.drawer = new Player;
        this.started = false;
        this.canStart = false;
        this.wordchoice = [];
        this.winners = []
        this.round = 1;
        this.turn = 1;
        this.selectedword = '';
        this.playerReward = 350;
    }

    addPlayer (socket){
        this.players.push(new Player(socket.username, socket));
    }

    setFirstDrawer (player){
        this.drawer = player;
        player.isDrawer = true;
    }

    nextDrawer (){
        if (this.turn < this.players.length){
            this.drawer.isDrawer = false;
			this.drawer.guessedRight = false;
            this.drawer = this.players[this.players.indexOf(this.drawer)+1]
            this.drawer.isDrawer = true;
			this.drawer.guessedRight = true;
            this.turn += 1;
        }
        else {
            this.round += 1;
            this.turn = 1;
            this.playerReward = 350;
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
        players.forEach(player => function(){
            if (player.guessedRight == true){
                counter += 1;
            }
        });
        if (counter > 0){
            drawer.addPoints(350);
        }
        if (counter == this.player.length-1){
            drawer.addPoints(50);
        }
    }

    playerRewardReset (){
        this.playerReward = 350;
    }

    playerGetByName (name){
        return this.players.find(player => player.name == name);
    }
	
	checkWin(){
        return this.players.every(player => (player.guessedRight && !player.isDrawer))
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
const lobby = new Game(lobbies.length,new Rules(10,wordBase,5));
lobbies.push(lobby);


// importer le module socket.io
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
		//client.lobby.drawer = client.lobby.playerGetByName(client.username);
		alertAll ('update-players', client.lobby.getPlayers(), client.lobby.players);
	});

	client.on('guess-word', (guessedword) => {
		client.lobby.compareAnswer(guessedword, client.username);
		if(client.username != client.lobby.drawer.name){
			if (guessedword == client.lobby.selectedword){
			  simpleAlert('You-guessed-right',null,client.lobby.playerGetByName(client.username));
			  if (client.lobby.checkWin()){
				client.lobby.drawerReward();
				newTurn (lobby);
			  }
			}
			else {
			  alertAll('add-messages', {text: client.username + ':' + guessedword + ' is false'}, client.lobby.players);
			}
		}else{
			simpleAlert('add-messages', 'tricheur',client.lobby.drawer);
		}
	});
	
	client.on('dragging-update', (dragging) => {
		if (client.username == client.lobby.drawer.name){
			alertAll('dragging-update', dragging, client.lobby.players);
		}
	});

	client.on('stroke', (e) => {
		console.log(client.username);
		if (client.username == client.lobby.drawer.name){
			alertAll('stroke', e, client.lobby.players);
		}
	});
	client.on('clear', (e) => {
		if (client.username == client.lobby.drawer.name){
			alertAll('clear', null, client.lobby.players);
		}
	});
	client.on('start', () => {
		client.lobby.setFirstDrawer(client.lobby.players[0]);
		//alertAll ('New-drawer',client.lobby.drawer.name, client.lobby.players);
		client.lobby.setWordChoices();
		const choices = {0:lobby.wordchoice[0],1:lobby.wordchoice[1],2:lobby.wordchoice[2]}
		simpleAlert('Choose-a-word',choices,lobby.drawer);
	});

	client.on('choosen-word', (word) => {
		client.lobby.setSelectedWord(word);
		const dashed = '-'.repeat(word.length);
		const players = [...client.lobby.players];
		const index = client.lobby.players.indexOf(client.lobby.drawer);
		players.splice(index, 1);

		
		alertAll('New-word', word, players);
		
		simpleAlert('New-word',word,client.lobby.drawer);
		
		
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
  alertAll ('end-of-turn', null,lobby.players);
  alertAll ('update-players', lobby.getPlayers(), lobby.players);
  clearInterval (lobby.timer);
  lobby.nextDrawer();
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






