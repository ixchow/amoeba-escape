"use strict";
//NOTE: some of this boilerplate code taken from the TCHOW 2016 New Year's card "pins & noodles".

let ctx = null;

const TILE_SIZE = 10;

const TILES_IMG = new Image();
TILES_IMG.onload = function(){
	console.log("tiles loaded.");
};
TILES_IMG.src = "tiles.png";


//n.b. coordinates are in 0,0-is-upper-left system, unlike TILES:
const SPRITES = {
	undo:{x:61, y:261, width:31, height:8},
	reset:{x:61, y:271, width:36, height:8},
	next:{x:61, y:251, width:31, height:8},
	title:{x:1, y:1, width:120, height:90},
	end:{x:74, y:94, width:120, height:90},
};

const TILES = {
	//blob edges indexed by filled quadrant:
	//4 8
	//1 2
	blobEdges:[],blobSick:[],blobDead:[],
	blobGrow:{E:null, N:null, W:null, S:null},
	//wall sides/tops indexed by adjacent walls:
	//.2.
	//4 1
	//.8.
	wallSides:[],
	//border fade-out:
	border:{E:null, NE:null, N:null, NW:null, W:null, SW:null, S:null, SE:null},
	//exit arrows:
	exit:{E:null, N:null, W:null, S:null},
	//doors:
	doorUp:null, doorDown:null,
	//buttons:
	buttonUp:null,buttonDown:null,
	//logic stuff:
	logicOutOff:{E:null, N:null, W:null, S:null},
	logicOutOn:{E:null, N:null, W:null, S:null},
	person:{x:50, y:0},
	poison:{x:50, y:30},
};

(function fill_TILES() {
	//note: must flip Y for blobMap to match lower-left-origin image layout
	const blobMap = [
		0,0,0,1,1,0,0,0,
		1,0,0,1,1,1,1,1,
		1,0,0,1,1,1,1,1,
		0,1,1,1,1,1,1,0,
		0,1,1,1,1,1,1,0,
		0,0,0,0,0,1,1,0,
		0,0,0,0,0,1,1,0,
		0,0,0,1,1,0,0,0
	];
	for (let i = 0; i < 16; ++i) {
		TILES.blobEdges.push(null);
		//TILES.wallTops.push(null);
		TILES.wallSides.push(null);
	}
	for (let y = 0; y < 4; ++y) {
		for (let x = 0; x < 4; ++x) {
			let bits = 0;
			if (blobMap[2*x  +(7-2*y  )*8]) bits |= 1;
			if (blobMap[2*x+1+(7-2*y  )*8]) bits |= 2;
			if (blobMap[2*x  +(7-2*y-1)*8]) bits |= 4;
			if (blobMap[2*x+1+(7-2*y-1)*8]) bits |= 8;
			console.assert(TILES.blobEdges[bits] === null, "No duplicate tiles.");
			TILES.blobEdges[bits] = {x:5 + TILE_SIZE*x, y: 5 + TILE_SIZE*y};
		}
	}

	TILES.blobEdges.forEach(function(e){
		TILES.blobSick.push({x:e.x-5, y:e.y+95});
		TILES.blobDead.push({x:e.x-5, y:e.y+55});
	});

	TILES.blobGrow.N = {x:0*TILE_SIZE, y:5*TILE_SIZE};
	TILES.blobGrow.E = {x:1*TILE_SIZE, y:5*TILE_SIZE};
	TILES.blobGrow.S = {x:2*TILE_SIZE, y:5*TILE_SIZE};
	TILES.blobGrow.W = {x:3*TILE_SIZE, y:5*TILE_SIZE};
	//wall tiles are stored in a basic 4-edge order
	//bits:
	//.2.
	//4 1
	//.8.
	//NOTE: need to flip Y-coord for this too
	const wallMap = [
		0x8,0x9,0xd,0xc,
		0xa,0xb,0xf,0xe,
		0x2,0x3,0x7,0x6,
		0x0,0x1,0x5,0x4,
	];
	for (let y = 0; y < 4; ++y) {
		for (let x = 0; x < 4; ++x) {
			let bits = wallMap[x+(3-y)*4];
			console.assert(TILES.wallSides[bits] === null, "No duplicate tiles.");
			TILES.wallSides[bits] = {x:60 + TILE_SIZE*x, y:TILE_SIZE*y};
			//console.assert(TILES.wallTops[bits] === null, "No duplicate tiles.");
			//TILES.wallTops[bits] = {x:100 + TILE_SIZE*x, y:TILE_SIZE*y};
		}
	}
	TILES.doorDown = {x:100, y:0};
	TILES.doorUp = {x:110, y:0};
	TILES.buttonDown = {x:100, y:10};
	TILES.buttonUp = {x:110, y:10};

	TILES.border.SW = {x:120 + TILE_SIZE*0, y:0 + TILE_SIZE*0};
	TILES.border.S  = {x:120 + TILE_SIZE*1, y:0 + TILE_SIZE*0};
	TILES.border.SE = {x:120 + TILE_SIZE*2, y:0 + TILE_SIZE*0};
	TILES.border.W  = {x:120 + TILE_SIZE*0, y:0 + TILE_SIZE*1};
	TILES.border.E  = {x:120 + TILE_SIZE*2, y:0 + TILE_SIZE*1};
	TILES.border.NW = {x:120 + TILE_SIZE*0, y:0 + TILE_SIZE*2};
	TILES.border.N  = {x:120 + TILE_SIZE*1, y:0 + TILE_SIZE*2};
	TILES.border.NE = {x:120 + TILE_SIZE*2, y:0 + TILE_SIZE*2};

	TILES.exit.S  = {x:150 + TILE_SIZE*1, y:0 + TILE_SIZE*0};
	TILES.exit.W  = {x:150 + TILE_SIZE*0, y:0 + TILE_SIZE*1};
	TILES.exit.E  = {x:150 + TILE_SIZE*2, y:0 + TILE_SIZE*1};
	TILES.exit.N  = {x:150 + TILE_SIZE*1, y:0 + TILE_SIZE*2};

	TILES.logicOutOff.W = {x:180, y:TILE_SIZE*0};
	TILES.logicOutOff.N = {x:180, y:TILE_SIZE*1};
	TILES.logicOutOff.E = {x:180, y:TILE_SIZE*2};
	TILES.logicOutOff.S = {x:180, y:TILE_SIZE*3};

	TILES.logicOutOn.W = {x:190, y:TILE_SIZE*0};
	TILES.logicOutOn.N = {x:190, y:TILE_SIZE*1};
	TILES.logicOutOn.E = {x:190, y:TILE_SIZE*2};
	TILES.logicOutOn.S = {x:190, y:TILE_SIZE*3};
})();

let mouse = { x:NaN, y:NaN };

let board = {
	size:{x:5, y:5},
	exit:{x:0, y:0},
	start:{x:0, y:0},
	walls:[ ],
	blob:[ ], //<-- bits: 1=exists, 2=connected, 4=poisoned
	wires:[ ],
	signals:[ ],
	logic:[ ],
	buttons:[ ],
	doors:[ ],
	people:[], //<-- list of {x:,y:}
	poison:[] //<-- list of {x:,y:}
};

let picture = null;

let undoStack = [];

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

function makeBoard(map,layers,library) {
	if (typeof(layers) === 'undefined') layers = 1;
	if (typeof(library) === 'undefined') library = {};
	let size = {x:map[0].length, y:map.length/layers};
	let exit = {};
	let start = {};
	let walls = [];
	let blob = [];
	let wires = [];
	let signals = [];
	let logic = [];
	let buttons = [];
	let doors = [];
	let people = [];
	let poison = [];

	for (let i = 0; i < size.x * size.y; ++i) {
		walls.push(0);
		blob.push(0);
		wires.push(0);
		signals.push(0);
		logic.push(0);
		buttons.push(0);
		doors.push(0);
	}

	let ret = {
		size:{x:map[0].length, y:map.length},
	};
	for (let y = 0; y < size.y; ++y) {
		for (let x = 0; x < size.x; ++x) {
			for (let l = 0; l < layers; ++l) {
				let c = map[(size.y-1-y)*layers+l][x];
				if (c === '#') walls[size.x*y+x] = 1;
				if (c === '=') doors[size.x*y+x] = 1;
				if (c === 'n') buttons[size.x*y+x] = 1;
				if (c === 'B') {
					blob[size.x*y+x] = 1;
					if (!('x' in start) || x === 0 || y === 0 || x+1 == size.x || y+1 === size.y) {
						start = {x:x, y:y};
					}
				}
				if (c === 'A') people.push({x:x, y:y});
				if (c === 'x') poison.push({x:x, y:y});
				if (c === '+') wires[size.x*y+x] |= 0x80; //temporary 'hey, wires here' bit
				if (c === 'E') exit = {x:x, y:y};
				if (c in library) {
					logic[size.x*y+x] = library[c];
					wires[size.x*y+x] |= 0x80;
				}
			}
		}
	}
	function wantsWire(x,y) {
		if (x < 0 || x >= size.x || y < 0 || y >= size.y) return false;
		if (logic[size.x*y+x] !== 0) return true;
		if (buttons[size.x*y+x] !== 0) return true;
		if (doors[size.x*y+x] !== 0) return true;
		if (wires[size.x*y+x] & 0x80) return true;
		return false;
	}
	for (let y = 0; y < size.y; ++y) {
		for (let x = 0; x < size.x; ++x) {
			for (let l = 0; l < layers; ++l) {
				if (wires[size.x*y+x] & 0x80) {
					if (wantsWire(x-1,y)) {
						wires[size.x*y+x] |= 4;
						if (x > 0) wires[size.x*y+x-1] |= 1;
					}
					if (wantsWire(x,y-1)) {
						wires[size.x*y+x] |= 8;
						if (y > 0) wires[size.x*(y-1)+x] |= 2;
					}
					if (wantsWire(x+1,y)) {
						wires[size.x*y+x] |= 1;
						if (x+1 < size.x) wires[size.x*y+x+1] |= 4;
					}
					if (wantsWire(x,y+1)) {
						wires[size.x*y+x] |= 2;
						if (y+1 < size.y) wires[size.x*(y+1)+x] |= 8;
					}
				}
			}
		}
	}

	return {
		size:size,
		start:start,
		exit:exit,
		walls:walls,
		blob:blob,
		wires:wires,
		signals:signals,
		logic:logic,
		buttons:buttons,
		doors:doors,
		people:people,
		poison:poison
	};
}

function cloneBoard(b) {
	function cloneObjArray(arr) {
		let ret = [];
		arr.forEach(function(obj){
			let clone = {};
			for (var name in obj) {
				clone[name] = obj[name];
			}
			ret.push(clone);
		});
		return ret;
	}
	return {
		size:{x:b.size.x, y:b.size.y},
		start:{x:b.start.x, y:b.start.y},
		exit:{x:b.exit.x, y:b.exit.y},
		walls:b.walls.slice(),
		blob:b.blob.slice(),
		wires:b.wires.slice(),
		signals:b.signals.slice(),
		logic:b.logic.slice(),
		buttons:b.buttons.slice(),
		doors:b.doors.slice(),
		people:cloneObjArray(b.people),
		poison:cloneObjArray(b.poison),
	};
}

function undo() {
	if (board) {
		if (undoStack.length) {
			board = undoStack.pop();
		}
	}
}

function reset() {
	if (board) {
		if (undoStack.length) {
			undoStack.push(board);
			board = cloneBoard(undoStack[0]);
		}
	}
}

const LEVELS = [
	{picture:SPRITES.title
	},
	{title:"click to grow",
	board:[
		"#######",
		"#B    E",
		"#######"
	]},
	{title:"grow in any directions",
	board:[
		"######E#",
		"#....#.#",
		"BB...#.#",
		"#..###.#",
		"#......#",
		"########"
	]},
	{title:"watch out for poison",
	board:[
		"###E#",
		"#...#",
		"#.#x#",
		"#.#.#",
		"#..B#",
		"###B#"
	]},
	{title:"buttons can be useful",
	board:[
		"######","......",
		"#.n..#","..+...",
		"####.#","..+...",
		"E=+..#","......",
		"#..B.#","......",
		"###B##","......",
	],layers:2},
	{title:"buttons can be harmful",
	board:[
		"########",
		"#......#",
		"#.####.#",
		"E=+n>=BB",
		"########",
	],layers:1,library:{'>':0x44}},
	{title:"people run",
	board:[
		"#######",
		"BB..###",
		"#.#.#.E",
		"#..A..#",
		"###.###",
		"#######"
	]},
	{title:"people push buttons",
	board:[
		"##B####",
		"#....=E",
		"#.#.#+#",
		"#.A.xn#",
		"#######"
	],layers:1,library:{'^':0x88}},
	{title:"false choice",
	board:[
		"####B####", ".........",
		"#...=+..#", ".........",
		"#....^..#", ".........",
		"#.n+A+n.#", "....+....",
		"#.#####.#", ".........",
		"#.......#", ".........",
		"####E####", "........."
	],layers:2,library:{'^':0x88}},
	{title:"sacrifice",
	board:[
		"#########",
		"#.......#",
		"#######.#",
		"E..x.>=BB",
		"#####n###",
		"#########",
	],library:{'>':0x88}},
	{picture:SPRITES.end
	},
];

LEVELS.forEach(function(level){
	if (level.picture) return;
	console.log(level.title);
	level.board = makeBoard(level.board, level.layers, level.library);
});

function setBoard(newBoard) {
	board = cloneBoard(newBoard);
	computeSignals();
	markBlob();
	undoStack = [];
}

let maxLevel = 0;
let currentLevel;

function setLevel(idx) {
	if (currentLevel !== idx) {
		if (history && history.replaceState) history.replaceState({},"","?" + idx);
	}
	currentLevel = idx;
	maxLevel = Math.max(maxLevel, currentLevel);
	if (LEVELS[currentLevel].picture) {
		picture = LEVELS[currentLevel].picture;
		board = null;
	} else {
		picture = null;
		setBoard(LEVELS[currentLevel].board);
	}
}

if (document.location.search.match(/^\?\d+/)) {
	setLevel(parseInt(document.location.search.substr(1)));
} else {
	setLevel(0);
}

function next() {
	if (isWon()) setLevel(currentLevel + 1);
}

function draw() {
	ctx.setTransform(1,0, 0,-1, 0,canvas.height);
	ctx.globalAlpha = 1.0;

	ctx.fillStyle = '#000';
	ctx.fillRect(0,0, ctx.width,ctx.height);

	if (board) {
		board.offset = {
			x:Math.floor((ctx.width - board.size.x*TILE_SIZE)/2),
			y:Math.floor((ctx.height - 10 - board.size.y*TILE_SIZE + 10)/2)
		};

		if (mouse.x === mouse.x) {
			mouse.tx = Math.floor((mouse.x - board.offset.x) / TILE_SIZE);
			mouse.ty = Math.floor((mouse.y - board.offset.y) / TILE_SIZE);
		}
	}

	function drawSprite(x,y,sprite) {
		ctx.save();
		ctx.setTransform(1,0, 0,1, x, ctx.height-y-sprite.height);
		ctx.drawImage(TILES_IMG, sprite.x, sprite.y, sprite.width, sprite.height, 0, 0, sprite.width, sprite.height);
		ctx.restore();
	}

	if (picture) {
		drawSprite(0,Math.floor((ctx.height-picture.height)/2), picture);
	} else {

	ctx.setTransform(1,0, 0,-1, board.offset.x,canvas.height-board.offset.y);

	function drawTile(x,y,tile) {
		ctx.save();
		ctx.setTransform(1,0, 0,1, x+board.offset.x, ctx.height-y-TILE_SIZE-board.offset.y);
		ctx.drawImage(TILES_IMG, tile.x, TILES_IMG.height-tile.y-TILE_SIZE, TILE_SIZE,TILE_SIZE, 0, 0,TILE_SIZE,TILE_SIZE);
		ctx.restore();
	}

	function drawQuarterTile(x,y,ox,oy,tile) {
		ctx.save();
		ctx.setTransform(1,0, 0,1, (x+ox)+board.offset.x, ctx.height-(y+oy)-TILE_SIZE/2-board.offset.y);
		ctx.drawImage(TILES_IMG, tile.x+ox, TILES_IMG.height-(tile.y+oy)-TILE_SIZE/2, TILE_SIZE/2,TILE_SIZE/2, 0, 0,TILE_SIZE/2,TILE_SIZE/2);
		ctx.restore();
	}

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
				if (board.signals[x+y*board.size.x] & 0x80) ctx.fillStyle = "#fff";
				else ctx.fillStyle = "#6b6b6b";
				ctx.fillRect(x*TILE_SIZE+TILE_SIZE/2-2, y*TILE_SIZE+TILE_SIZE/2-2,4,4);
				if (board.logic[x+y*board.size.x] & 0x1) {
					if (board.signals[x+y*board.size.x] & 0x1) ctx.fillStyle = "#fff";
					else ctx.fillStyle = "#6b6b6b";
					if (board.logic[x+y*board.size.x] & 0x10) {
						ctx.fillRect(x*TILE_SIZE+TILE_SIZE/2+3,y*TILE_SIZE+TILE_SIZE/2-2,1,4);
						ctx.fillRect(x*TILE_SIZE+TILE_SIZE/2+4,y*TILE_SIZE+TILE_SIZE/2-1,TILE_SIZE/2-4,2);
					} else {
						ctx.fillRect(x*TILE_SIZE+TILE_SIZE/2+2,y*TILE_SIZE+TILE_SIZE/2-1,TILE_SIZE/2-2,2);
					}
				} else if (board.wires[x+y*board.size.x] & 0x1) {
					if (board.signals[x+y*board.size.x] & 0x1) {
						drawTile(x*TILE_SIZE, y*TILE_SIZE, TILES.logicOutOn.E);
					} else {
						drawTile(x*TILE_SIZE, y*TILE_SIZE, TILES.logicOutOff.E);
					}
				}
				if (board.logic[x+y*board.size.x] & 0x2) {
					if (board.signals[x+y*board.size.x] & 0x2) ctx.fillStyle = "#fff";
					else ctx.fillStyle = "#6b6b6b";
					if (board.logic[x+y*board.size.x] & 0x20) {
						ctx.fillRect(x*TILE_SIZE+TILE_SIZE/2-2,y*TILE_SIZE+TILE_SIZE/2+3,4,1);
						ctx.fillRect(x*TILE_SIZE+TILE_SIZE/2-1,y*TILE_SIZE+TILE_SIZE/2+3,2,TILE_SIZE/2-3);
					} else {
						ctx.fillRect(x*TILE_SIZE+TILE_SIZE/2-1,y*TILE_SIZE+TILE_SIZE/2+2,2,TILE_SIZE/2-2);
					}
				} else if (board.wires[x+y*board.size.x] & 0x2) {
					if (board.signals[x+y*board.size.x] & 0x2) {
						drawTile(x*TILE_SIZE, y*TILE_SIZE, TILES.logicOutOn.N);
					} else {
						drawTile(x*TILE_SIZE, y*TILE_SIZE, TILES.logicOutOff.N);
					}
				}
				if (board.logic[x+y*board.size.x] & 0x4) {
					if (board.signals[x+y*board.size.x] & 0x4) ctx.fillStyle = "#fff";
					else ctx.fillStyle = "#6b6b6b";
					if (board.logic[x+y*board.size.x] & 0x40) {
						ctx.fillRect(x*TILE_SIZE+TILE_SIZE/2-4,y*TILE_SIZE+TILE_SIZE/2-2,1,4);
						ctx.fillRect(x*TILE_SIZE,y*TILE_SIZE+TILE_SIZE/2-1,TILE_SIZE/2-4,2);
					} else {
						ctx.fillRect(x*TILE_SIZE,y*TILE_SIZE+TILE_SIZE/2-1,TILE_SIZE/2-2,2);
					}
				} else if (board.wires[x+y*board.size.x] & 0x4) {
					if (board.signals[x+y*board.size.x] & 0x4) {
						drawTile(x*TILE_SIZE, y*TILE_SIZE, TILES.logicOutOn.W);
					} else {
						drawTile(x*TILE_SIZE, y*TILE_SIZE, TILES.logicOutOff.W);
					}
				}
				if (board.logic[x+y*board.size.x] & 0x8) {
					if (board.signals[x+y*board.size.x] & 0x8) ctx.fillStyle = "#fff";
					else ctx.fillStyle = "#6b6b6b";
					if (board.logic[x+y*board.size.x] & 0x80) {
						ctx.fillRect(x*TILE_SIZE+TILE_SIZE/2-2,y*TILE_SIZE+TILE_SIZE/2-4,4,1);
						ctx.fillRect(x*TILE_SIZE+TILE_SIZE/2-1,y*TILE_SIZE,2,TILE_SIZE/2-3);
					} else {
						ctx.fillRect(x*TILE_SIZE+TILE_SIZE/2-1,y*TILE_SIZE,2,TILE_SIZE/2-2);
					}
				} else if (board.wires[x+y*board.size.x] & 0x8) {
					if (board.signals[x+y*board.size.x] & 0x8) {
						drawTile(x*TILE_SIZE, y*TILE_SIZE, TILES.logicOutOn.S);
					} else {
						drawTile(x*TILE_SIZE, y*TILE_SIZE, TILES.logicOutOff.S);
					}
				}
			} else {
				let onCount = 0;
				let offCount = 0;
				if (board.wires[x+y*board.size.x] & 0x1) {
					if (board.signals[x+y*board.size.x] & 0x1) { ctx.fillStyle = "#fff"; ++onCount; }
					else { ctx.fillStyle = "#6b6b6b"; ++offCount; }
					ctx.fillRect(x*TILE_SIZE+TILE_SIZE/2+1, y*TILE_SIZE+TILE_SIZE/2-1,TILE_SIZE/2-1,2);
				}
				if (board.wires[x+y*board.size.x] & 0x2) {
					if (board.signals[x+y*board.size.x] & 0x2) { ctx.fillStyle = "#fff"; ++onCount; }
					else { ctx.fillStyle = "#6b6b6b"; ++offCount; }
					if (board.signals[x+y*board.size.x] & 0x2) ctx.fillStyle = "#fff";
					else ctx.fillStyle = "#6b6b6b";
					ctx.fillRect(x*TILE_SIZE+TILE_SIZE/2-1, y*TILE_SIZE+TILE_SIZE/2+1,2,TILE_SIZE/2-1);
				}
				if (board.wires[x+y*board.size.x] & 0x4) {
					if (board.signals[x+y*board.size.x] & 0x4) { ctx.fillStyle = "#fff"; ++onCount; }
					else { ctx.fillStyle = "#6b6b6b"; ++offCount; }
					ctx.fillRect(x*TILE_SIZE, y*TILE_SIZE+TILE_SIZE/2-1,TILE_SIZE/2-1,2);
				}
				if (board.wires[x+y*board.size.x] & 0x8) {
					if (board.signals[x+y*board.size.x] & 0x8) { ctx.fillStyle = "#fff"; ++onCount; }
					else { ctx.fillStyle = "#6b6b6b"; ++offCount; }
					ctx.fillRect(x*TILE_SIZE+TILE_SIZE/2-1, y*TILE_SIZE,2,TILE_SIZE/2-1);
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
					drawTile(x*TILE_SIZE, y*TILE_SIZE, TILES.buttonDown);
				} else {
					drawTile(x*TILE_SIZE, y*TILE_SIZE, TILES.buttonUp);
				}
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
					drawTile(TILE_SIZE*x, TILE_SIZE*y, TILES.doorDown);
				} else {
					//closed door
					drawTile(TILE_SIZE*x, TILE_SIZE*y, TILES.doorUp);
				}
			}
		}
	}

	//draw poison:
	board.poison.forEach(function(p){
		drawTile(TILE_SIZE*p.x, TILE_SIZE*p.y, TILES.poison);
	});

	//draw people:
	board.people.forEach(function(p){
		drawTile(TILE_SIZE*p.x, TILE_SIZE*p.y, TILES.person);
	});


	//draw blob:

	//note: blob uses corner tiles
	for (let y = 0; y <= board.size.y; ++y) {
		for (let x = 0; x <= board.size.x; ++x) {
			function getStyle(x,y) {
				if (x >= 0 && y >= 0 && x < board.size.x && y < board.size.y) {
					let b = board.blob[y*board.size.x+x];
					if ((b & 1)) {
						if (b & 4) return 4;
						else if (b & 2) return 2;
						else return 1;
					} else {
						return 0;
					}
				} else {
					return 0;
				}
			}
			let style = [
				getStyle(x-1,y-1),
				getStyle(x,y-1),
				getStyle(x-1,y),
				getStyle(x,y)
			];
			let bits = (style[0] ? 1 : 0) | (style[1] ? 2 : 0) | (style[2] ? 4 : 0) | (style[3] ? 8 : 0);

			if (style[0] === 0) style[0] = Math.max(style[1], style[2]);
			if (style[3] === 0) style[3] = Math.max(style[1], style[2]);
			if (style[1] === 0) style[1] = Math.max(style[0], style[3]);
			if (style[2] === 0) style[2] = Math.max(style[0], style[3]);

			if (bits) {
				function styleTile(n) {
					if (style[n] === 4) return TILES.blobSick[bits];
					else if (style[n] === 2) return TILES.blobEdges[bits];
					else return TILES.blobDead[bits];
				}
				//drawTile(TILE_SIZE*x-TILE_SIZE/2, TILE_SIZE*y-TILE_SIZE/2, styleTile(0));
				drawQuarterTile(TILE_SIZE*x-TILE_SIZE/2, TILE_SIZE*y-TILE_SIZE/2, 0,0, styleTile(0));
				drawQuarterTile(TILE_SIZE*x-TILE_SIZE/2, TILE_SIZE*y-TILE_SIZE/2, TILE_SIZE/2,0, styleTile(1));
				drawQuarterTile(TILE_SIZE*x-TILE_SIZE/2, TILE_SIZE*y-TILE_SIZE/2, 0,TILE_SIZE/2, styleTile(2));
				drawQuarterTile(TILE_SIZE*x-TILE_SIZE/2, TILE_SIZE*y-TILE_SIZE/2, TILE_SIZE/2,TILE_SIZE/2, styleTile(3));
			}
			//if (board.blob[y*board.size.x+x]) {
			//	ctx.fillStyle = '#1b1';
			//	ctx.fillRect(x*TILE_SIZE+1, y*TILE_SIZE+1, TILE_SIZE-2, TILE_SIZE-2);
			//}
		}
	}

	//draw walls:
	ctx.globalAlpha = 1.0;
	for (let y = 0; y < board.size.y; ++y) {
		for (let x = 0; x < board.size.x; ++x) {
			if (board.walls[y*board.size.x+x]) {
				let bits = 0;
				if (x+1 < board.size.x && board.walls[y*board.size.x+x+1]) bits |= 1;
				if (y+1 < board.size.y && board.walls[(y+1)*board.size.x+x]) bits |= 2;
				if (x > 0 && board.walls[y*board.size.x+x-1]) bits |= 4;
				if (y > 0 && board.walls[(y-1)*board.size.x+x]) bits |= 8;

				drawTile(TILE_SIZE*x, TILE_SIZE*y, TILES.wallSides[bits]);
			}
		}
	}



	//draw border:
	drawTile(TILE_SIZE*0, TILE_SIZE*0, TILES.border.SW);
	drawTile(TILE_SIZE*0, TILE_SIZE*(board.size.y-1), TILES.border.NW);
	drawTile(TILE_SIZE*(board.size.x-1), TILE_SIZE*0, TILES.border.SE);
	drawTile(TILE_SIZE*(board.size.x-1), TILE_SIZE*(board.size.y-1), TILES.border.NE);
	for (let y = 1; y + 1 < board.size.y; ++y) {
		drawTile(TILE_SIZE*0, TILE_SIZE*y, TILES.border.W);
		drawTile(TILE_SIZE*(board.size.x-1), TILE_SIZE*y, TILES.border.E);
	}
	for (let x = 1; x + 1 < board.size.x; ++x) {
		drawTile(TILE_SIZE*x, TILE_SIZE*0, TILES.border.S);
		drawTile(TILE_SIZE*x, TILE_SIZE*(board.size.y-1), TILES.border.N);
	}

	if (board.exit.x + 1 === board.size.x) {
		drawTile(TILE_SIZE*board.exit.x + TILE_SIZE/2, TILE_SIZE*board.exit.y, TILES.exit.E);
	}
	if (board.exit.y + 1 === board.size.y) {
		drawTile(TILE_SIZE*board.exit.x, TILE_SIZE*board.exit.y + TILE_SIZE/2, TILES.exit.N);
	}
	if (board.exit.x === 0) {
		drawTile(TILE_SIZE*board.exit.x - TILE_SIZE/2, TILE_SIZE*board.exit.y, TILES.exit.W);
	}
	if (board.exit.y === 0) {
		drawTile(TILE_SIZE*board.exit.x, TILE_SIZE*board.exit.y - TILE_SIZE/2, TILES.exit.S);
	}

	//grow outline:
	if ('tx' in mouse) {
		let g = canGrowTo(mouse.tx, mouse.ty);
		if (g !== null) {
			drawTile(mouse.tx*TILE_SIZE, mouse.ty*TILE_SIZE, TILES.blobGrow[g]);
		}
	}

	} //end if(picture) else 

	ctx.setTransform(1,0, 0,-1, 0,canvas.height);

	ctx.fillStyle = '#444';
	if (mouse.overReset && board) {
		ctx.fillRect(1,1,SPRITES.reset.width, SPRITES.reset.height);
	}
	if (mouse.overUndo && board) {
		ctx.fillRect(ctx.width-1-SPRITES.undo.width,1,SPRITES.undo.width, SPRITES.undo.height);
	}

	if (isWon()) {
		let y = (picture ? 1 : 10);
		if (mouse.overNext) {
			ctx.fillRect(Math.floor((ctx.width-SPRITES.next.width)/2), y, SPRITES.next.width, SPRITES.next.height);
		}
		drawSprite(Math.floor((ctx.width-SPRITES.next.width)/2), y, SPRITES.next);
	}

	if (board) {
		drawSprite(1,1, SPRITES.reset);
		drawSprite(ctx.width-1-SPRITES.undo.width,1, SPRITES.undo);
	}

	//draw mouse:
	if (mouse.x === mouse.x) {
		ctx.fillStyle = "#fff";
		ctx.fillRect(mouse.x - 1, mouse.y, 3, 1);
		ctx.fillRect(mouse.x, mouse.y - 1, 1, 3);
		ctx.fillStyle = "#000";
		ctx.fillRect(mouse.x, mouse.y, 1, 1);
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

function isBlob(tx, ty, connected) {
	if (tx < 0 || tx >= board.size.x || ty < 0 || ty >= board.size.y) return false;
	if (connected) {
		return (board.blob[tx+ty*board.size.x] & 2) && !(board.blob[tx+ty*board.size.x] & 4);
	} else {
		return board.blob[tx+ty*board.size.x] & 1;
	}
}

function isPerson(tx, ty) {
	return board.people.some(function(p){
		return p.x === tx && p.y === ty;
	});
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

function isWon() {
	return currentLevel + 1 < LEVELS.length && (board === null || board.blob[board.exit.x+board.exit.y*board.size.x]);
}

function markBlob() {
	//mark whole blob as disconnected:
	for (let y = 0; y < board.size.y; ++y) {
		for (let x = 0; x < board.size.x; ++x) {
			board.blob[y*board.size.x+x] &= ~2; //mark everything disconnected
		}
	}
	if (board.blob[board.start.y*board.size.x+board.start.x] & 1) {
		board.blob[board.start.y*board.size.x+board.start.x] |= 2; //mark start as connected
		let todo = [board.start];
		while (todo.length) {
			let at = todo.pop();
			[{x:-1,y:0},{x:1,y:0},{x:0,y:-1},{x:0,y:1}].forEach(function(step){
				let n = {x:at.x+step.x, y:at.y+step.y};
				if (board.blob[n.y*board.size.x+n.x] & 1) {
					if (!(board.blob[n.y*board.size.x+n.x] & 2)) {
						board.blob[n.y*board.size.x+n.x] |= 2;
						todo.push(n);
					}
				}
			});
		}
	}
}

function spreadSickness() {
	let sick = [];
	for (let y = 0; y < board.size.y; ++y) {
		for (let x = 0; x < board.size.x; ++x) {
			if (board.blob[y*board.size.x+x] & 4) {
				sick.push({x:x,y:y});
			}
		}
	}
	//neighbors to sick blob get sick:
	sick.forEach(function(s){
		[{x:-1,y:0},{x:1,y:0},{x:0,y:-1},{x:0,y:1}].forEach(function(ofs){
			let n = {x:s.x+ofs.x, y:s.y+ofs.y};
			if (n.x >= 0 && n.y >= 0 && n.x < board.size.x && n.y < board.size.y) {
				if (board.blob[n.y*board.size.x+n.x] & 1) {
					board.blob[n.y*board.size.x+n.x] |= 4;
				}
			}
		});
	});

	//blob on poison gets sick:
	let remain = [];
	board.poison.forEach(function(p){
		if (board.blob[p.y*board.size.x+p.x] & 1) {
			board.blob[p.y*board.size.x+p.x] |= 4;
		} else {
			remain.push(p);
		}
	});
	board.poison = remain;

	//sick blobs die:
	sick.forEach(function(s){
		board.blob[s.y*board.size.x+s.x] = 0;
	});
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
				let pushed = isBlob(x,y) || isPerson(x,y);
				board.buttons[x+y*board.size.x] = (pushed ? 2 : 1);
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

	//console.log("Have " + netsNotNull.length + " nets and " + components.length + " components.");

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

	components.forEach(function(c){
		if (c.value()) {
			board.signals[c.x+c.y*board.size.x] |= 0x80;
		}
	});
}

function canGrowTo(tx, ty) {
	if (isBlob(tx,ty)) return null; //can't grow where there is already blob
	if (isSolid(tx,ty)) return null; //can't grow into wall
	if (isPerson(tx,ty)) return null; //can't grow into people
	if (isBlob(tx-1,ty,true)) return 'E';
	if (isBlob(tx+1,ty,true)) return 'W';
	if (isBlob(tx,ty+1,true)) return 'S';
	if (isBlob(tx,ty-1,true)) return 'N';
	return null;
}

function growTo(tx, ty) {
	if (isBlob(tx,ty)) return; //can't grow where there is already blob
	if (isSolid(tx,ty)) return; //can't grow into wall
	if (isPerson(tx,ty)) return; //can't grow into person
	if (!(isBlob(tx-1,ty,true) || isBlob(tx+1,ty,true) || isBlob(tx,ty-1,true) || isBlob(tx,ty+1,true))) return; //can't grow if not adjacent to blob

	undoStack.push(board);
	board = cloneBoard(board);

	//actually grow:
	board.blob[tx+ty*board.size.x] = 1;


	//move people:
	board.people.forEach(function(p){
		//look for nearest blob:
		let dis = Infinity;
		let dir = {x:0, y:0};

		[{x:1,y:0},{x:-1,y:0},{x:0,y:1},{x:0,y:-1}].forEach(function(step){
			let s = 0;
			if (isSolid(p.x-step.x,p.y-step.y) || isBlob(p.x-step.x,p.y-step.y)) return;
			while (!isSolid(p.x+s*step.x, p.y+s*step.y) && !isBlob(p.x+s*step.x, p.y+s*step.y)) ++s;
			if (isBlob(p.x+s*step.x, p.y+s*step.y)) {
				if (s < dis) {
					dis = s;
					dir = {x:-step.x, y:-step.y};
				}
			}
		});
		if (dis !== Infinity) {
			if (!isPerson(p.x+dir.x, p.y+dir.y) && !isSolid(p.x+dir.x, p.y+dir.y) && !isBlob(p.x+dir.x,p.y+dir.y)) {
				p.x += dir.x;
				p.y += dir.y;
			}
		}
	});

	//update signals:
	computeSignals();

	//kill blob as needed:
	spreadSickness();

	//update blob markings:
	markBlob();

	//and, of course, update signals (in case blob died off of a button):
	computeSignals();
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

		if (board !== null) {
			mouse.tx = Math.floor((mouse.x - board.offset.x) / TILE_SIZE);
			mouse.ty = Math.floor((mouse.y - board.offset.y) / TILE_SIZE);
		}

		function inRect(x,y,w,h) {
			return (mouse.x >= x && mouse.x < x+w && mouse.y >= y && mouse.y < y+h);
		}

		mouse.overReset = inRect(1,1,SPRITES.reset.width,SPRITES.reset.height);
		mouse.overUndo = inRect(ctx.width-1-SPRITES.undo.width,1,SPRITES.undo.width,SPRITES.undo.height);
		let y = (picture ? 1 : 10);
		mouse.overNext = inRect(Math.floor((ctx.width-SPRITES.next.width)/2),y,SPRITES.next.width, SPRITES.next.height);
	}

	function handleDown() {
		if (mouse.overReset) {
			reset();
		} else if (mouse.overUndo) {
			undo();
		} else if (mouse.overNext) {
			next();
		} else if (mouse.tx >= 0 && mouse.tx < board.size.x && mouse.ty >= 0 && mouse.ty < board.size.y) {
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
