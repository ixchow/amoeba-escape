"use strict";
//NOTE: some of this boilerplate code taken from the TCHOW 2016 New Year's card "pins & noodles".

let ctx = null;

const TILE_SIZE = 10;

const TILES = {
};

let mouse = { x:NaN, y:NaN };

let board = {
	size:{x:5, y:5},
	walls:[
		1,0,1,1,1,
		1,0,0,0,1,
		1,0,0,0,1,
		1,0,0,0,1,
		1,1,1,0,1
	],
	blob:[
		0,0,0,0,0,
		0,0,0,0,0,
		0,0,0,0,0,
		0,0,0,0,0,
		0,0,0,1,0
	],
	wires:[
		0x0,0x2,0x0,0x0,0x0,
		0x0,0x9,0x7,0x0,0x0,
		0x0,0xb,0xf,0xe,0x0,
		0x0,0x0,0xd,0x0,0x0,
		0x0,0x0,0x0,0x0,0x0,
	],
	signals:[
		0,0,0,0,0,
		0,0,0,0,0,
		0,0,0,0,0,
		0,0,0,0,0,
		0,0,0,0,0,
	],
	logic:[
		0,8,0,0,0,
		0,0,0,0,0,
		0,0,0,0,0,
		0,0,0,0,0,
		0,0,0,0,0,
	],
	buttons:[
		0,0,0,0,0,
		0,0,0,0,0,
		0,0,1,0,0,
		0,0,0,0,0,
		0,0,0,0,0,
	],
	doors:[
		0,1,0,0,0,
		0,0,0,0,0,
		0,0,0,0,0,
		0,0,0,0,0,
		0,0,0,0,0,
	]
};
//wires go from center of tile to edge:
// . 2 .
// 4   1
// . 8 .

//signals use the same notation as wires

//logic 'is input' bits:
// . 2 .
// 4   1
// . 8 .

//logic 'is negated' bits:
//  . 20 .
// 40   10
//  . 80 .


/*
board = makeBoard([
	"#.###",
	"#...#",
	"#...#",
	"#...#",
	"###.#"
]);
*/
function draw() {
	ctx.setTransform(1,0, 0,-1, 0,canvas.height);
	ctx.globalAlpha = 1.0;

	ctx.fillStyle = '#f0f';
	ctx.fillRect(0,0, ctx.width,ctx.height);

	//draw floor:
	for (let y = 0; y < board.size.y; ++y) {
		for (let x = 0; x < board.size.x; ++x) {
			ctx.fillStyle = "#9e9e9e";
			ctx.fillRect(x*TILE_SIZE, y*TILE_SIZE, TILE_SIZE/2, TILE_SIZE/2);
			ctx.fillRect(x*TILE_SIZE+TILE_SIZE/2, y*TILE_SIZE+TILE_SIZE/2, TILE_SIZE/2, TILE_SIZE/2);
			ctx.fillStyle = "#d3d3d3";
			ctx.fillRect(x*TILE_SIZE+TILE_SIZE/2, y*TILE_SIZE, TILE_SIZE/2, TILE_SIZE/2);
			ctx.fillRect(x*TILE_SIZE, y*TILE_SIZE+TILE_SIZE/2, TILE_SIZE/2, TILE_SIZE/2);
		}
	}

	//draw wires / logic:
	for (let y = 0; y < board.size.y; ++y) {
		for (let x = 0; x < board.size.x; ++x) {
			if (board.logic[x+y*board.size.x]) {
				//logic core:
				if (board.signals[x+y*board.size.x] & 0x1) ctx.fillStyle = "#fff";
				else ctx.fillStyle = "#6b6b6b";
				ctx.fillRect(x*TILE_SIZE+TILE_SIZE/2-2, y*TILE_SIZE+TILE_SIZE/2-2,4,4);
				if (board.logic[x+y*board.size.x] & 0x1) {
					if (board.logic[x+y*board.size.x] & 0x10) {
						ctx.fillRect(x*TILE_SIZE+TILE_SIZE/2+3,y*TILE_SIZE+TILE_SIZE/2-2,1,4);
						ctx.fillRect(x*TILE_SIZE+TILE_SIZE/2+4,y*TILE_SIZE+TILE_SIZE/2-1,TILE_SIZE/2-4,2);
					} else {
						ctx.fillRect(x*TILE_SIZE+TILE_SIZE/2+2,y*TILE_SIZE+TILE_SIZE/2-1,TILE_SIZE/2-2,2);
					}
				}
				if (board.logic[x+y*board.size.x] & 0x2) {
					if (board.logic[x+y*board.size.x] & 0x20) {
						ctx.fillRect(x*TILE_SIZE+TILE_SIZE/2-2,y*TILE_SIZE+TILE_SIZE/2+3,4,1);
						ctx.fillRect(x*TILE_SIZE+TILE_SIZE/2-1,y*TILE_SIZE+TILE_SIZE/2+3,2,TILE_SIZE/2-3);
					} else {
						ctx.fillRect(x*TILE_SIZE+TILE_SIZE/2-1,y*TILE_SIZE+TILE_SIZE/2+2,2,TILE_SIZE/2-2);
					}
				}
				if (board.logic[x+y*board.size.x] & 0x4) {
					if (board.logic[x+y*board.size.x] & 0x40) {
						ctx.fillRect(x*TILE_SIZE+TILE_SIZE/2-4,y*TILE_SIZE+TILE_SIZE/2-2,1,4);
						ctx.fillRect(x*TILE_SIZE,y*TILE_SIZE+TILE_SIZE/2-1,TILE_SIZE/2-4,2);
					} else {
						ctx.fillRect(x*TILE_SIZE,y*TILE_SIZE+TILE_SIZE/2-1,TILE_SIZE/2-2,2);
					}
				}
				if (board.logic[x+y*board.size.x] & 0x8) {
					if (board.logic[x+y*board.size.x] & 0x80) {
						ctx.fillRect(x*TILE_SIZE+TILE_SIZE/2-2,y*TILE_SIZE+TILE_SIZE/2-4,4,1);
						ctx.fillRect(x*TILE_SIZE+TILE_SIZE/2-1,y*TILE_SIZE,2,TILE_SIZE/2-3);
					} else {
						ctx.fillRect(x*TILE_SIZE+TILE_SIZE/2-1,y*TILE_SIZE,2,TILE_SIZE/2-2);
					}
				}
			} else {
				let onCount = 0;
				let offCount = 0;
				if (board.wires[x+y*board.size.x] & 0x1) {
					if (board.signals[x+y*board.size.x] & 0x1) { ctx.fillStyle = "#fff"; ++onCount; }
					else { ctx.fillStyle = "#6b6b6b"; ++offCount; }
					ctx.fillRect(x*TILE_SIZE+TILE_SIZE/2+2, y*TILE_SIZE+TILE_SIZE/2-1,TILE_SIZE/2-2,2);
				}
				if (board.wires[x+y*board.size.x] & 0x2) {
					if (board.signals[x+y*board.size.x] & 0x2) { ctx.fillStyle = "#fff"; ++onCount; }
					else { ctx.fillStyle = "#6b6b6b"; ++offCount; }
					if (board.signals[x+y*board.size.x] & 0x2) ctx.fillStyle = "#fff";
					else ctx.fillStyle = "#6b6b6b";
					ctx.fillRect(x*TILE_SIZE+TILE_SIZE/2-1, y*TILE_SIZE+TILE_SIZE/2+2,2,TILE_SIZE/2-2);
				}
				if (board.wires[x+y*board.size.x] & 0x4) {
					if (board.signals[x+y*board.size.x] & 0x4) { ctx.fillStyle = "#fff"; ++onCount; }
					else { ctx.fillStyle = "#6b6b6b"; ++offCount; }
					ctx.fillRect(x*TILE_SIZE, y*TILE_SIZE+TILE_SIZE/2-1,TILE_SIZE/2-2,2);
				}
				if (board.wires[x+y*board.size.x] & 0x8) {
					if (board.signals[x+y*board.size.x] & 0x8) { ctx.fillStyle = "#fff"; ++onCount; }
					else { ctx.fillStyle = "#6b6b6b"; ++offCount; }
					ctx.fillRect(x*TILE_SIZE+TILE_SIZE/2-1, y*TILE_SIZE,2,TILE_SIZE/2-2);
				}
				if (onCount + offCount > 1) {
					if (onCount >= offCount) ctx.fillStyle = "#fff";
					else ctx.fillStyle = "#6b6b6b";
					ctx.fillRect(x*TILE_SIZE+TILE_SIZE/2-1, y*TILE_SIZE+TILE_SIZE/2-1,2,2);
				}
			}
		}
	}

	//draw buttons:
	for (let y = 0; y < board.size.y; ++y) {
		for (let x = 0; x < board.size.x; ++x) {
			if (board.buttons[x+y*board.size.x]) {
				if (board.buttons[x+y*board.size.x] > 1) {
					ctx.fillStyle = "fff";
					ctx.fillRect(x*TILE_SIZE+1,y*TILE_SIZE+1, TILE_SIZE-2, TILE_SIZE-3);
					ctx.fillStyle = "#f2f2f2";
					ctx.fillRect(x*TILE_SIZE+2,y*TILE_SIZE+2, TILE_SIZE-4, TILE_SIZE-4);
					ctx.fillStyle = "#d2d2d2";
					ctx.fillRect(x*TILE_SIZE+2,y*TILE_SIZE+2, TILE_SIZE-4, 1);
				} else {
					ctx.fillStyle = "#6b6b6b";
					ctx.fillRect(x*TILE_SIZE+1,y*TILE_SIZE+1, TILE_SIZE-2, TILE_SIZE-3);
					ctx.fillStyle = "#f2f2f2";
					ctx.fillRect(x*TILE_SIZE+2,y*TILE_SIZE+2, TILE_SIZE-4, TILE_SIZE-3);
					ctx.fillStyle = "#b8b8b8";
					ctx.fillRect(x*TILE_SIZE+2,y*TILE_SIZE+2, TILE_SIZE-4, 1);
				}
			}
		}
	}


	//draw blob:
	ctx.globalAlpha = 0.5;
	for (let y = 0; y < board.size.y; ++y) {
		for (let x = 0; x < board.size.x; ++x) {
			if (board.blob[y*board.size.x+x]) {
				ctx.fillStyle = '#1b1';
				ctx.fillRect(x*TILE_SIZE+1, y*TILE_SIZE+1, TILE_SIZE-2, TILE_SIZE-2);
			}
		}
	}

	//draw walls:
	ctx.globalAlpha = 1.0;
	for (let y = 0; y < board.size.y; ++y) {
		for (let x = 0; x < board.size.x; ++x) {
			if (board.walls[y*board.size.x+x]) {
				ctx.fillStyle = '#000';
				ctx.fillRect(x*TILE_SIZE+1, y*TILE_SIZE+1, TILE_SIZE-2, TILE_SIZE-2);
			}
		}
	}

	//draw doors:
	ctx.globalAlpha = 1.0;
	for (let y = 0; y < board.size.y; ++y) {
		for (let x = 0; x < board.size.x; ++x) {
			if (board.doors[y*board.size.x+x]) {
				let vert = (isWall(x,y+1) && isWall(x,y-1));
				if (board.doors[y*board.size.x+x] === 2) {
					//open door
					if (vert) {
					} else {
						ctx.fillStyle = '#888';
						ctx.fillRect(x*TILE_SIZE, y*TILE_SIZE+TILE_SIZE/2-2, TILE_SIZE, 3);
					}
				} else {
					//closed door
					if (vert) {
					} else {
						ctx.fillStyle = '#888';
						ctx.fillRect(x*TILE_SIZE, y*TILE_SIZE+TILE_SIZE/2-2, TILE_SIZE, TILE_SIZE/2+1);
						ctx.fillStyle = '#000';
						ctx.fillRect(x*TILE_SIZE, y*TILE_SIZE+TILE_SIZE-1, TILE_SIZE, 1);
					}
				}
			}
		}
	}

	//draw mouse:
	if (mouse.x === mouse.x) {
		ctx.fillStyle = "#000";
		ctx.fillRect(mouse.x - 10, mouse.y, 20, 1);
		ctx.fillRect(mouse.x, mouse.y - 10, 1, 20);
	}

	/*
	//mouse location:
	ctx.beginPath();
	ctx.moveTo(mouse.x-0.3, mouse.y-0.3);
	ctx.lineTo(mouse.x+0.3, mouse.y+0.3);
	ctx.moveTo(mouse.x-0.3, mouse.y+0.3);
	ctx.lineTo(mouse.x+0.3, mouse.y-0.3);
	ctx.strokeStyle = '#fff';
	ctx.lineWidth = px;
	ctx.stroke();
	*/

}

function update(elapsed) {
	//NOTE: should probably compute whether drawing is needed to save cpu.
}

function isBlob(tx, ty) {
	if (tx < 0 || tx >= board.size.x || ty < 0 || ty >= board.size.y) return false;
	return board.blob[tx+ty*board.size.x] !== 0;
}

function isWall(tx, ty) {
	if (tx < 0 || tx >= board.size.x || ty < 0 || ty >= board.size.y) return true;
	if (board.walls[tx+ty*board.size.x] !== 0) return true;
	return false;
}
function isSolid(tx, ty) {
	if (tx < 0 || tx >= board.size.x || ty < 0 || ty >= board.size.y) return true;
	if (board.walls[tx+ty*board.size.x] !== 0) return true;
	if (board.doors[tx+ty*board.size.x] === 1) return true;
	return false;
}


function computeSignals() {
	let nets = [];
	for (let y = 0; y < board.size.y; ++y) {
		for (let x = 0; x < board.size.x; ++x) {
			nets.push({'1':null, '2':null, '4':null, '8':null});
		}
	}
	function setNet(x,y,side,net) {
		if (x < 0 || x >= board.size.x || y < 0 || y >= board.size.y) return;
		if ((board.wires[x+y*board.size.x] & side) === 0) return; //no nets where there are no wires
		if (nets[x+board.size.x*y][side] === net) return;
		console.assert(nets[x+board.size.x*y][side] === null, "should not setNet conflicting nets");

		nets[x+board.size.x*y][side] = net;

		if      (side === 0x1) setNet(x+1,y,4,net);
		else if (side === 0x2) setNet(x,y+1,8,net);
		else if (side === 0x4) setNet(x-1,y,1,net);
		else if (side === 0x8) setNet(x,y-1,2,net);

		if (board.buttons[x+y*board.size.x]) {
			//button doesn't pass signal
		} else if (board.logic[x+y*board.size.x]) {
			//logic doesn't pass signal
		} else {
			//wires *do* pass signal:
			setNet(x,y,1,net);
			setNet(x,y,2,net);
			setNet(x,y,4,net);
			setNet(x,y,8,net);
		}
	}

	let netsNotNull = [];

	for (let y = 0; y < board.size.y; ++y) {
		for (let x = 0; x < board.size.x; ++x) {
			[1,2,4,8].forEach(function(side){
				if (board.wires[x+y*board.size.x] & side) {
					if (nets[x+y*board.size.x][side] === null) {
						setNet(x,y,side,{value:false, writers:[], readers:[]});
						netsNotNull.push(nets[x+y*board.size.x][side]);
					}
				}
			});
		}
	}

	let components = [];

	for (let y = 0; y < board.size.y; ++y) {
		for (let x = 0; x < board.size.x; ++x) {
			if (board.buttons[x+y*board.size.x]) {
				let outs = [];
				[1,2,4,8].forEach(function(side){
					if (nets[x+y*board.size.x][side] !== null) {
						outs.push(nets[x+y*board.size.x][side]);
					}
				});
				let pushed = (board.buttons[x+y*board.size.x] > 1);
				components.push({
					x:x, y:y,
					ins:[],
					outs:outs,
					value:function(){ return pushed; }
				});
			} else if (board.logic[x+y*board.size.x]) {
				let ins = [];
				let outs = [];
				let neg = [];
				[1,2,4,8].forEach(function(side){
					if (nets[x+y*board.size.x][side] !== null) {
						if (board.logic[x+y*board.size.x] & side) {
							ins.push(nets[x+y*board.size.x][side]);
							neg.push((board.logic[x+y*board.size.x] & (side << 4)) !== 0);
						} else {
							outs.push(nets[x+y*board.size.x][side]);
						}
					}
				});

				components.push({
					x:x, y:y,
					ins:ins,
					outs:outs,
					value:function(){
						//logic is || of inputs
						let val = false;
						for (let i = 0; i < ins.length; ++i) {
							if (ins[i].value !== neg[i]) val = true;
						}
						return val;
					}
				});
			}
		}
	}

	components.forEach(function(c){
		c.ins.forEach(function(i){
			i.readers.push(c);
		});
		c.outs.forEach(function(o){
			o.writers.push(c);
		});
	});

	for (let i = 0; i < 10; ++i) {
		netsNotNull.forEach(function(net){
			let val = false;
			net.writers.forEach(function(w){
				if (w.value()) val = true;
			});
			net.value = val;
		});
	}

	console.log("Have " + netsNotNull.length + " nets and " + components.length + " components.");

	
	for (let y = 0; y < board.size.y; ++y) {
		for (let x = 0; x < board.size.x; ++x) {
			let signal = 0;
			[1,2,4,8].forEach(function(side){
				if (nets[x+y*board.size.x][side] !== null
				 && nets[x+y*board.size.x][side].value) {
					signal |= side;
				}
			});
			board.signals[x+y*board.size.x] = signal;

			if (board.doors[x+y*board.size.x]) {
				if (signal !== 0) {
					board.doors[x+y*board.size.x] = 2;
				} else {
					board.doors[x+y*board.size.x] = 1;
					board.blob[x+y*board.size.x] = 0;
				}
			}
		}
	}
}

function growTo(tx, ty) {
	if (isBlob(tx,ty)) return; //can't grow where there is already blob
	if (isSolid(tx,ty)) return; //can't grow into wall
	if (!(isBlob(tx-1,ty) || isBlob(tx+1,ty) || isBlob(tx,ty-1) || isBlob(tx,ty+1))) return; //can't grow if not adjacent to blob

	//actually grow:
	board.blob[tx+ty*board.size.x] = 1;

	//mark button pressed:
	if (board.buttons[tx+ty*board.size.x]) {
		board.buttons[tx+ty*board.size.x] = 2;
		computeSignals();
	}
}

function setup() {
	let canvas = document.getElementById("canvas");
	ctx = canvas.getContext('2d');
	ctx.width = canvas.width;
	ctx.height = canvas.height;

	//------------

	function setMouse(evt) {
		var rect = canvas.getBoundingClientRect();
		mouse.x = Math.floor( (evt.clientX - rect.left) / rect.width * ctx.width );
		mouse.y = Math.floor( (evt.clientY - rect.bottom) / -rect.height * ctx.height );

		mouse.tx = Math.floor(mouse.x / TILE_SIZE);
		mouse.ty = Math.floor(mouse.y / TILE_SIZE);
	}

	function handleDown() {
		if (mouse.tx >= 0 && mouse.tx < board.size.x && mouse.ty >= 0 && mouse.ty < board.size.y) {
			//check if it's okay to grow to the given tile:
			growTo(mouse.tx, mouse.ty);
		}
	}

	function handleUp() {
	}

	canvas.addEventListener('touchstart', function(evt){
		evt.preventDefault();
		setMouse(evt.touches[0]);
		handleDown(evt.touches[0]);
		return false;
	});
	canvas.addEventListener('touchmove', function(evt){
		evt.preventDefault();
		setMouse(evt.touches[0]);
		return false;
	});
	canvas.addEventListener('touchend', function(evt){
		handleUp();
		mouse.x = NaN;
		mouse.y = NaN;
		return false;
	});

	window.addEventListener('mousemove', function(evt){
		evt.preventDefault();
		setMouse(evt);
		return false;
	});
	window.addEventListener('mousedown', function(evt){
		evt.preventDefault();
		setMouse(evt);
		handleDown(evt);
		return false;
	});

	window.addEventListener('mouseup', function(evt){
		evt.preventDefault();
		setMouse(evt);
		handleUp();
		return false;
	});


	//------------

	function resized() {
		let game = document.getElementById("game");
		let style = getComputedStyle(game);
		let size = {x:game.clientWidth, y:game.clientHeight};
		size.x -= parseInt(style.getPropertyValue("padding-left")) + parseInt(style.getPropertyValue("padding-right"));
		size.y -= parseInt(style.getPropertyValue("padding-top")) + parseInt(style.getPropertyValue("padding-bottom"));

		let mul = Math.max(1, Math.min(Math.floor(size.x / canvas.width), Math.floor(size.y / canvas.height)));
		size.x = mul * canvas.width;
		size.y = mul * canvas.height;

		canvas.style.width = size.x + "px";
		canvas.style.height = size.y + "px";
	}

	window.addEventListener('resize', resized);
	resized();

	let requestAnimFrame =
		window.requestAnimationFrame
		|| window.webkitRequestAnimationFrame
		|| window.mozRequestAnimationFrame
		|| window.oRequestAnimationFrame
		|| window.msRequestAnimationFrame
	;

	if (!requestAnimFrame) {
		alert("browser does not appear to support requestAnimationFrame");
		return;
	}

	var previous = NaN;
	var acc = 0.0;
	function animate(timestamp) {
		if (isNaN(previous)) {
			previous = timestamp;
		}
		var elapsed = (timestamp - previous) / 1000.0;
		previous = timestamp;

		//Run update (variable timestep):
		update(elapsed);

		//Draw:
		draw();

		requestAnimFrame(animate);
	}

	requestAnimFrame(animate);


}
