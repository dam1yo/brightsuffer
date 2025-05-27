//=============================================================================
// RPG Maker MV - CT_Bolt's Region System
//=============================================================================
/*
 * Terms of Use:
 *   Free for commercial and non commercial use in projects.
 *   Enjoy! Happy Game Making!
 *
 */

//=============================================================================
/*:
 * @target MV
 * @plugindesc [RPG Maker MV] [Tier 1] [Version 2.00] [CT_Bolt - Region System]
 * @author CT_Bolt
 *
 * @param ---Main Settings---
 * @text Main Settings
 *
 * @param Master Switch ID
 * @text Master Switch ID
 * @type number
 * @parent ---Main Settings---
 * @desc Master Switch ID
 * @default
 *
 * @param Transfer Notetag
 * @text Transfer Notetag
 * @type string
 * @parent ---Main Settings---
 * @desc Transfer Notetag
 * @default Transfer
 *
 * @param Script Notetag
 * @text Script Notetag
 * @type string
 * @parent ---Main Settings---
 * @desc Script Notetag
 * @default Script
 *
 * @param Code Notetag
 * @text Code Notetag
 * @type string
 * @parent ---Main Settings---
 * @desc Code Notetag
 * @default Code
 *
 * @param Seperator
 * @text Seperator
 * @type string
 * @parent ---Main Settings---
 * @desc Seperator
 Do NOT use comma
 * @default ;
 *
 * @help
 * ***************** Description **********************
 * Setup notetags in the Map Notebox to specify certain
 * actions upon moving into a region such as transfering
 * the player to another location/map :)
 *
 * ****************** How to Use **********************
 * Place the following notetags in the Map Notebox :)
 *
 * Map Notetags:
 *  Transfer [Region ID]; [Map ID]; [X]; [Y]; [Direction]; [Fade Type]; [Conditions]; [Script]; [Just Script?]
 *
 *  Examples:
 *   Transfer 4; 2; 0; null; 0; 0; {1}
 *     Activates on Region 4
 *     Transfers to Map 2, Tile (0, Player's Y)
 *     Retain Direction, Fade to Black
 *     Only activate if conditions #1
 *
 *   Transfer 3; 1; $gamePlayer.x; 20; 8; 1; 4; AudioManager.playSe({name:'Cursor1', volume: 100, pitch: 90, pan:0})
 *     Activates on Region 3
 *     Transfers to Map 1, Tile (Player's X, 20)
 *     Force Direction UP, Fade to Black
 *     Only activate if moving in the Left direction
 *     Plays an SE file
 *
 *   Transfer 3; 1; $gamePlayer.x; 20; 8; 1; 4; AudioManager.playSe({name:'Cursor1', volume: 100, pitch: 90, pan:0}); true
 *     Activates on Region 3
 *     Only activate if moving in the Left direction
 *     Plays an SE file
 *     Setting the last param to true doesn't transfer and only runs the script
 *
 *   Script 2; AudioManager.playSe({name:'Cursor1', volume: 100, pitch: 90, pan:0})
 *     Activates on Region 2
 *     Plays an SE file
 *
 * ***************** Compatibility ********************
 *
 *
 *
 * History Log:
 *    v1.00 Initial Release (Feb. 11, 2020)
 *    v2.00 Rewrite (Jan. 26, 2023)
 */
 
var CTB = CTB || {}; CTB.regionSystem  = CTB.regionSystem || {};
var Imported = Imported || {}; Imported["CT_Bolt Region"] = 1.0;

//-----------------------------------------------------------------------------
// Core Functions
//-----------------------------------------------------------------------------
function readMapData(id){var getData = new XMLHttpRequest(); getData.open("GET", "data/" + 'Map%1.json'.format(id.padZero(3)), false); getData.send(null); return JSON.parse(getData.responseText);}
function readRegionData(){var getData = new XMLHttpRequest();try {getData.open("GET", "data/" + 'CTB_Region.json', false); getData.send(null); if (getData.status != 200) console.log(`Error ${getData.status}: ${getData.statusText}`);}catch(err){console.log(`Missing data/CTB_Region.json`); return null;} return JSON.parse(getData.responseText);}
function showMsg(text){$gameMessage.setBackground(0);$gameMessage.setPositionType(1);$gameMessage.add(text);}
//-----------------------------------------------------------------------------

var $dataRegions = null;

//-----------------------------------------------------------------------------
// Main Code
//-----------------------------------------------------------------------------
(($_$) => {	
	function getPluginParameters() {var a = document.currentScript || (function() { var b = document.getElementsByTagName('script'); return b[b.length - 1]; })(); return PluginManager.parameters(a.src.substring((a.src.lastIndexOf('/') + 1), a.src.indexOf('.js')));} $_$.params = getPluginParameters();
	
	// Alias
	$_$['DataManager.loadDatabase'] = DataManager.loadDatabase;
	DataManager.loadDatabase = function() {
		$_$['DataManager.loadDatabase'].apply(this, arguments);
		$dataRegions = readRegionData();
	};

	// New
	Game_Map.prototype.getRegionDataAt = function(id) {return this._regionData[id];};

	// New
	Game_Map.prototype.readRegionNotetags = function() {
	var note = $dataMap.note.split(/[\r\n]/);
	var transferNotetag = $_$.params['Transfer Notetag'] || 'Transfer';
	var scriptNotetag = $_$.params['Script Notetag'] || 'Script';
	var codeNotetag = $_$.params['Code Notetag'] || 'Code';
	var seperator = $_$.params['Seperator'] || ';'

	for (var i = 0; i < note.length; i++) {

	  var params = [];
	  if (note[i].includes(scriptNotetag)){var params = []; params['type'] = 'script'; var notetag = scriptNotetag; }
	  if (note[i].includes(transferNotetag)){var params = []; params['type'] = 'transfer'; var notetag = transferNotetag; }
	  if (note[i].includes(codeNotetag)){var params = []; params['type'] = 'code'; var notetag = codeNotetag;}

	  if (notetag){
		var temp = note[i].replace(notetag, '').replace('<', '');
		temp = temp.replace(">", "").replace(" ", "").split(seperator);
		for (var j = 0; j < temp.length; j++){params.push(temp[j].replace(" ", ""))}
		var regionId = params[0]; params.shift();
		this._regionData[regionId] = this._regionData[regionId] || [];
		this._regionData[regionId].push(params);
	  }
	}
	};

	$_$['Game_Map.prototype.setup'] = Game_Map.prototype.setup;
	Game_Map.prototype.setup = function(mapId) {
		$_$['Game_Map.prototype.setup'].apply(this, arguments);
		this._regionData = {};
		this.readRegionNotetags();
	};
	
	// New
	Game_CharacterBase.prototype.is = function(e) {
		return this === e;
	};

  // Alias
  $_$['Game_CharacterBase.prototype.moveStraight'] = Game_CharacterBase.prototype.moveStraight;
  Game_CharacterBase.prototype.moveStraight = function(d) {
    $_$['Game_CharacterBase.prototype.moveStraight'].apply(this, arguments);
	let canMove = false;	
    this.setMovementSuccess(this.canPass(this._x, this._y, d));
    if (this.isMovementSucceeded()) {canMove = true;};

    var masterSwitch = true;
    if (eval($_$.params['Master Switch ID'])) masterSwitch = $gameSwitches.value(eval($_$.params['Master Switch ID']));

    if (masterSwitch){
      var data = $gameMap.getRegionDataAt(this.regionId()) || [];
      for (var i = 0; i < data.length; i++){
        if (data[i]) {
		  if (data[i]['type'] === 'code'){
			  let newData = [];			  
			  for (let j = 0; j < 5; j++){newData[j] = "0";};			  
			  data[i].forEach(v => {newData.push(v);}, this);
			  newData.push(true);			  
			  data[i] = newData;			  
			  data[i]['type'] = 'transfer';
		  };
		  
          if (data[i]['type'] === 'transfer'){
            var evData = [];

            // Map ID
            evData[0] = (data[i][0] !== 'null' && data[i][0] !== 'camera') ? eval(data[i][0]) : ($gameMap._mapId || null);

            if (typeof data[i][1] === 'string'){
              if ((data[i][1].replace(' ', '').includes("width")) || (data[i][1].replace(' ', '').includes("height"))) var mapData = readMapData(evData[0]);

              if (typeof data[i][1] === 'string'){
              if (data[i][1].replace(' ', '').includes("width")) {
                var mapWidth = mapData.width-1;
                if(data[i][1].includes('-')) mapWidth = mapWidth + eval(/-./.exec(data[i][1])[0]);
                if(data[i][1].indexOf('+') !== -1) mapWidth = mapWidth + eval(data[i][1].slice(data[i][1].indexOf('+')));
                data[i][1] = mapWidth;
              }
              }
              if (typeof data[i][1] === 'string'){
              if (data[i][1].replace(' ', '').includes("height")){
                var mapHeight = mapData.height-1;
                if(data[i][1].includes('-')) mapHeight = mapHeight + eval(/-./.exec(data[i][1])[0]);
                if(data[i][1].indexOf('+') !== -1) mapHeight = mapHeight + eval(data[i][1].slice(data[i][1].indexOf('+')));
                data[i][1] = mapHeight;
              }
              }
            }

            if (typeof data[i][2] === 'string'){
              if ((data[i][2].replace(' ', '').includes("width")) || (data[i][2].replace(' ', '').includes("height"))) var mapData = readMapData(evData[0]);

              if (data[i][2].replace(' ', '').includes("width")) {
                var mapWidth = mapData.width-1;
                if(data[i][2].includes('-')) mapWidth = mapWidth + eval(/-./.exec(data[i][2])[0]);
                if(data[i][2].indexOf('+') !== -1) mapWidth = mapWidth + eval(data[i][2].slice(data[i][2].indexOf('+')));
                data[i][2] = mapWidth;
              }
              if (data[i][2].replace(' ', '').includes("height")){
                var mapHeight = mapData.height-1;
                if(data[i][2].includes('-')) mapHeight = mapHeight + eval(/-./.exec(data[i][2])[0]);
                if(data[i][2].indexOf('+') !== -1) mapHeight = mapHeight + eval(data[i][2].slice(data[i][2].indexOf('+')));
                data[i][2] = mapHeight;
              }
            }

            // X
            evData[1] = (data[i][1] !== 'null') ? eval(data[i][1]) : $gamePlayer.x;
            // Y
            evData[2] = (data[i][2] !== 'null') ? eval(data[i][2]) : $gamePlayer.y;
            // Direction
            evData[3] = (data[i][3] !== 'null') ? eval(data[i][3]) : 0;
            // Fade Type
            evData[4] = (data[i][4] !== 'null') ? eval(data[i][4]) : 0;
            // Conditions
            evData[5] = (data[i][5] !== 'null') ? eval(data[i][5]) : 0;
  
            var canTransfer = true;
  
            // Condition Checking
            if (data[i][5]){
              if (!data[i][5].includes('{')) {				 
				if (evData[5] && evData[5] !== d) canTransfer = false;
              }else{
                if (evData[5]){
                  var canTransfer = false;
  
                  var isDirection = true;
                  if (eval($dataRegions[evData[5]].direction)) isDirection = false;
                  if (eval($dataRegions[evData[5]].direction) === d) isDirection = true;
				  
				  var isPlayer = true;
                  if (eval($dataRegions[evData[5]].isPlayer)){
					  var isPlayer = this.is($gamePlayer);
				  };
				  
                  var eventOnly = true;
                  if (eval($dataRegions[evData[5]].eventOnly)){
					  if (!this.constructor.name.toLowerCase().includes('event')){
						  eventOnly = false;
					  };					
                  };
				  
                  var eventList = true;
				  let eList = eval($dataRegions[evData[5]].eventList);
                  if (eList){
					  if (!this.constructor.name.toLowerCase().includes('event')){
						  eventList = false;
					  }else{
						  eventList = eList.includes(this.eventId());
					  };
                  };
				  
                  var excludedEventList = true;
				  eList = eval($dataRegions[evData[5]].excludedEventList);
                  if (eList){
					  if (this.constructor.name.toLowerCase().includes('event')){
						  excludedEventList = !eList.includes(this.eventId());
					  };
                  };
  
                  var isActor = true;
                  if (eval($dataRegions[evData[5]].actorId)){
                    isActor = false;
                    $gameParty.members().forEach(function(actor){
                      if (actor._actorId === eval($dataRegions[evData[5]].actorId)) {isActor = true;}
                    },this);
                  };
  
                  var isItem = true;
                  if (eval($dataRegions[evData[5]].itemId)){
                    isItem = false;
                    if ($gameParty.hasItem($dataItems[eval($dataRegions[evData[5]].itemId)], true)) {isItem = true;}
                  }
  
                  var isSwitch1 = true;
                  if (eval($dataRegions[evData[5]].switch1Id)){
                    isSwitch1 = false;
                    if ($gameSwitches.value(eval($dataRegions[evData[5]].switch1Id))) {isSwitch1 = true;}
                  }
  
                  var isSwitch2 = true;
                  if (eval($dataRegions[evData[5]].switch2Id)){
                    isSwitch2 = false;
                    if ($gameSwitches.value(eval($dataRegions[evData[5]].switch2Id))) {isSwitch2 = true;}
                  }
  
                  var isVariable = true;
                  if (eval($dataRegions[evData[5]].variableId) && eval($dataRegions[evData[5]].variableValue)){
                    isVariable = false;
                    if ($gameVariables.value(eval($dataRegions[evData[5]].variableId)) >= eval($dataRegions[evData[5]].variableValue)) {isVariable = true;}
                  }
  
                  if (isDirection && isActor && isItem && isVariable && isSwitch1 && isSwitch2 && isPlayer && eventOnly && eventList && excludedEventList) canTransfer = true;
                }
              }
            }

            if (canTransfer) {
              if (data[i][6]) eval(data[i][6]);
              if (!data[i][7]) $gamePlayer.reserveTransfer(evData[0], evData[1], evData[2], evData[3] === 0 ? d : evData[3], evData[4]);
            }
          }else{
             if (data[i][0]) eval(data[i][0]);
          }
        }
      }

    }else{

    }
  };
})(CTB.regionSystem, this);
//-----------------------------------------------------------------------------