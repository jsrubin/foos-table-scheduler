/** @jsx React.DOM */
var React = require('react');
var ReactDom = require('react-dom');
var Modal = require('react-modal');
var _ = require('underscore');
var moment = require('moment');

Modal.setAppElement(document.getElementById('scheduler'));
Modal.injectCSS();

var Reservation = React.createClass({
	getInitialState: function () {
  		return {
  			url: '',
	    	available: true,
	    	availableFor: '',
	    	reservedTill: ''
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


    loadCommentsFromServer: function(e) {
    	var dataUrl = e ? (e.target ? e.target.getAttribute('data-url') : '') : '';
     	var url = dataUrl || this.state.url || this.props.url;
     	console.log("\n\n loadCommentsFromServer:::: " + url);

	    $.ajax({
	      url: url,
	      dataType: 'json',
	      cache: false,
	      success: function(data) {
console.log('\nloading comments from server.....');
console.log(data.available);
	    	if (data.available) {
        		document.body.className = 'available';
	    	} else {
	    		document.body.className = 'reserved';
	    	}

			this.setState({
				available: data.available,
				availableFor: data.availableFor,
				reservedTill: data.reservedTill
			});

	      }.bind(this),
	      error: function(xhr, status, err) {
	        console.error(this.props.url, status, err.toString());
	      }.bind(this)
	    });
	  },

   //  cancelReservationFromServer: function() {
   //   	var url = '/cancel';
	  //   $.ajax({
	  //     url: url,
	  //     dataType: 'json',
	  //     cache: false,
	  //     success: function(data) {

	  //   	if (data.available) {
   //      		document.body.className = 'available';
	  //   	} else {
	  //   		document.body.className = 'reserved';
	  //   	}

			// this.setState({
			// 	available: data.available,
			// 	availableFor: data.availableFor,
			// 	reservedTill: data.reservedTill
			// });

	  //     }.bind(this),
	  //     error: function(xhr, status, err) {
	  //       console.error(this.props.url, status, err.toString());
	  //     }.bind(this)
	  //   });
	  // },

	renderScheduler: function () {
		return (
		    React.createElement(Scheduler, {
	    		available: this.state.available,
	    		availableFor: this.state.availableFor,
		    	reservedTill: this.state.reservedTill,
		    	loadCommentsFromServer: this.loadCommentsFromServer
		    	})
		);
    },

    render: function () {
	    return (
	        <nav >
	          <div role="schedule"> 

	              {this.renderScheduler()}

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

var Scheduler = React.createClass({


	// leaderRowsUpcoming: function (ranking) {
	// 	return ranking.map(function(leader) {
	// 	    	var isPrimary = (leader.rank % 2 === 1) ? true : false;
	// 	    	var rank = leader.rank;
	// 	    	var rowClass = cx({
	// 							rank: true,
	// 							primary: {isPrimary} 
	// 						});
	// 	    	if (rank == 4 || rank == 5 || rank == 6) {
	// 		        return (
	// 						<tr className="rowChallenger">
	// 							<th scope="row"
	// 							className={cx({ 
	// 								row: true,
	// 								primary: {isPrimary}
	// 							})}>
	// 							</th><td 
	// 							className={rowClass}>
	// 							{leader.name}</td>
	// 							<td></td>
	// 						</tr>
	// 			     );
	// 		    }
	// 		});
	// },

	cancelReservationButton: function (cancelReservation) {
		// var cancel = [];

		// cancel.push()

		// return ranking.map(function(leader) {
		//     	var isPrimary = (leader.rank % 2 === 1) ? true : false;
		//     	var rank = leader.rank;
		//     	var rowClass = cx({
		// 						rank: true,
		// 						primary: {isPrimary} 
		// 					});
		//     	if (rank == 4 || rank == 5 || rank == 6) {
		// 	        return (
		// 					<tr className="rowChallenger">
		// 						<th scope="row"
		// 						className={cx({ 
		// 							row: true,
		// 							primary: {isPrimary}
		// 						})}>
		// 						</th><td 
		// 						className={rowClass}>
		// 						{leader.name}</td>
		// 						<td></td>
		// 					</tr>
		// 		     );
		// 	    }
		// 	});
	},

	reserveTableButtons: function () {
	},

	render: function() {
	    var available = this.props.available;
	    var availableFor = this.props.availableFor;
		var reservedTill = this.props.reservedTill;
		var postReservation = this.props.loadCommentsFromServer;

		var displayBody = [];
		var displayTitle = "Available";

		if (reservedTill) {
			displayTitle = "Reserved Till";
			reservedTill = moment(reservedTill).format("dddd, MMMM Do YYYY, h:mm:ss a");
			// render CANCEL button
			displayBody.push(<div><label for='role'>{reservedTill}</label><p>
				<button className='btn btn-info btn-lg' data-url='/cancel' data-id={reservedTill} onClick={postReservation}>Cancel</button></p></div>);
		} else {
			if (availableFor) {
				var b = "For Next " + availableFor + " Minutes";
				displayBody.push(<div>{b}</div>);
			}
			// render RESERVE INCREMENT BUTTONS
			displayBody.push(<div><label for='role'>{reservedTill}</label><p>
				<button className='btn btn-info btn-lg' data-url='/schedule' data-id={reservedTill} onClick={postReservation}>15</button>
				<button className='btn btn-info btn-lg' data-url='/schedule?reserve=30' data-id={reservedTill} onClick={postReservation}>30</button>
				<button className='btn btn-info btn-lg' data-url='/schedule?reserve=45' data-id={reservedTill} onClick={postReservation}>45</button>
				</p></div>);
		}

		// if (this.props.ranking && this.props.ranking.length > 0) {
		// 	var ranking = this.ranking(this.props.ranking);
		// 	leaderRows = this.leaderRowsTop(ranking, displayCount, renderHumor);
	    //    }
	    return (
			<div className="top6">
			<table className="table">
				<thead>
					<tr>
						<th scope="row" className="row">{displayTitle}</th>
					</tr>
				</thead>
				<tbody scope="row" className="row">
	            	{displayBody}
	    		</tbody>
	    	</table>
	    	</div>
		);
	}
});

ReactDom.render(<Reservation url="/available" pollInterval={10000} />, document.getElementById('scheduler'));