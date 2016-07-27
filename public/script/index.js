/** @jsx React.DOM */
var React = require('react');
var ReactDom = require('react-dom');
var Modal = require('react-modal');
var _ = require('underscore');

Modal.setAppElement(document.getElementById('leaderboard'));
Modal.injectCSS();

var Board = React.createClass({
	getInitialState: function () {
  		return {
  			url: '',
	    	ranking: [],
	    	newTopThree: [],
	    	topThree: [],
	    	humor: [],
	    	trash: []
	    };
	},

    /***
     * initial load components from server, write to file, short poll interval on file
     *
     */
    componentDidMount: function() {
        this.loadCommentsFromServer();
        setInterval(this.loadCommentsFromServer, this.props.pollInterval);
    },


    loadCommentsFromServer: function() {
     	var url = this.state.url || this.props.url;
	    $.ajax({
	      url: url,
	      dataType: 'json',
	      cache: false,
	      success: function(data) {
	              var newTopThree = _.filter(data.payload, function (top) {
	              	return top.rank == 1 || top.rank == 2 || top.rank == 3;
	              });

	              this.setState({
			    	ranking: data.ranking,
			    	newTopThree: newTopThree,
			    	humor: data.humor,
			    	trash: data.trashTalk
	              });

	      }.bind(this),
	      error: function(xhr, status, err) {
	        console.error(this.props.url, status, err.toString());
	      }.bind(this)
	    });
	  },

	renderHumor: function () {
		return (
		    React.createElement(HumorModule, {
		    	newTopThree: this.state.newTopThree,
		    	topThree: this.state.topThree,
	    		humor: this.state.humor,
	    		trash: this.state.trash
		    	})
		);
    },

	renderLeaderboard: function () {
		return (
		    React.createElement(Leaderboard, {
	    		ranking: this.state.ranking,
	    		newTopThree: this.state.newTopThree,
		    	topThree: this.state.topThree,
	    		renderHumor: this.renderHumor()
		    	})
		);
    },

    render: function () {
	    return (
	        <nav >
	          <div role="board"> 

	              {this.renderLeaderboard()}

	          </div>
	       </nav>
	    );
  	}
});

function cx(map) {
  var className = [];
  Object.keys(map).forEach(function (key) {
    if (map[key]) {
      className.push(key);
    }
  });
  return className.join(' ');
}

var HumorModule = React.createClass({
	render: function () {
		var humor = this.props.humor;
		var trash = this.props.trash;
		var newTop = this.props.newTopThree;
		var top = this.props.topThree;

		if (humor.length > 0) {
			var leaderChange = _.difference(top, newTop).length > 0 ? true : false;
			if (leaderChange) {
				humor = trash;
			}

			var r = Math.floor(Math.random() * (humor.length));

			var humorText = [];
			humorText.push(humor[r].text);
			var cls = humor[r].style;
	    	var rowClass = cx({
							triangle: true,
							right: cls == 'right' ? true : false,
							left: cls == 'left' ? true : false,
							top: cls == 'top' ? true : false,
						});
			return (
		  		<p className={rowClass}><i className="humor">"{humorText}"</i></p>
		  		);
		}
		return (
			<p></p>
			);
	}
})

var Leaderboard = React.createClass({

	score: function (wins, losses) {
		return Math.round((wins / (wins + losses)) * 100) / 100;
	},

	totalGames: function (wins, losses) {
		return wins + losses;
	},

	ranking: function (ranking) {
		var self = this;
		_.each(ranking, function (player) {
			player.score = self.score(player.wins, player.losses);
			player.total = self.totalGames(player.wins, player.losses);
		});

		return _.sortBy(ranking, function (player) {
			return player.score;
		}).reverse();
	},

	leaderRowsTop: function (ranking, displayCount, renderHumor) {
		return ranking.map(function(leader, index) {
				var rank = index + 1;
		    	var isPrimary = (rank % 2 === 1) ? true : false;
		    	var rowClass = cx({
								rank: true,
								primary: {isPrimary} 
							});
		    	var metal = [];

				var rand = Math.floor(Math.random() * (displayCount));

		    	if (rank == 1) {
		    		metal.push(<img src="resources/gold.png"/>);
		    	} if (rank == 2) {
		    		metal.push(<img src="resources/silver.png"/>);
		    	} if (rank == 3) {
		    		metal.push(<img src="resources/bronze.png"/>);
		    	}

		    	var humor = [];
		    	if (rank == rand) {
		    		humor.push(renderHumor);
		    	}

		    	if (rank <= displayCount) {
			        return (
							<tr>
								<td>
								</td>
								<th scope="row"
								className={cx({ 
									row: true,
									primary: {isPrimary} 
								})}>
								{rank}</th>
								<td 
								className={rowClass}>
								{leader.name}</td>
								<td>
								{leader.score} %
								</td>
								<td>{metal}</td>
							</tr>
				     );
			    }
			});
	},

	leaderRowsUpcoming: function (ranking) {
		return ranking.map(function(leader) {
		    	var isPrimary = (leader.rank % 2 === 1) ? true : false;
		    	var rank = leader.rank;
		    	var rowClass = cx({
								rank: true,
								primary: {isPrimary} 
							});
		    	if (rank == 4 || rank == 5 || rank == 6) {
			        return (
							<tr className="rowChallenger">
								<th scope="row"
								className={cx({ 
									row: true,
									primary: {isPrimary}
								})}>
								</th><td 
								className={rowClass}>
								{leader.name}</td>
								<td></td>
							</tr>
				     );
			    }
			});
	},

	render: function() {
		var newTopThree = this.props.newTopThree;
		var topThree = this.props.topThree;
		var leaderRows = [];
		var upcomingLeaderRows = [];
		var renderHumor = this.props.renderHumor;

		var displayCount = 6;

		if (this.props.ranking && this.props.ranking.length > 0) {
			var ranking = this.ranking(this.props.ranking);
			leaderRows = this.leaderRowsTop(ranking, displayCount, renderHumor);
			// upcomingLeaderRows = this.leaderRowsUpcoming(this.props.ranking);
	    }
	    return (
			<div className="top6">
			<table className="table">
				<thead>
					<tr>
						<th></th><th scope="row" className="row">Rank</th><th>Leader</th><th>Score</th><th></th>
					</tr>
				</thead>
				<tbody>
	            	{leaderRows}
	    		</tbody>
	    	</table>
	    	</div>
		);
	}
});

ReactDom.render(<Board url="/leaderboard" pollInterval={300000} />, document.getElementById('leaderboard'));