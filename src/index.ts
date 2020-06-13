import { InputController, KeyMappings } from "./input_controller";
import { Nes } from "./nes";
import { SaveState } from "./savestate";
import { DBExport } from "./dbexport";

declare var rivets, $, NoSleep,saveAs,toastr;

export class Rom {
    name: string = '';
    url: string = '';
}

//this is a good technique
//so i don't need to keep casting from window.app
var app: MyApp;

export class MyApp {
    inputController: InputController;
    rom_name: string = '';
    canvasSize: number = 400;
    lblStatus: string = '';
    mobileMode: boolean = false;
    platform: string = '';
    useragent: string = '';
    dblist: string[] = [];
    remapDefault = true;
    remapDefault2 = false;
    remapWait = false;
    romList: Rom[] = [];
    audioContext: AudioContext;
    nes: Nes;
    chkDebugChecked = false;
    chkSound = true;
    chkDisableGamepad = false;
    chkForceDesktop = false;
    chkForceMobile = false;
    romdevMode = false;




    constructor() {

        try {
            this.platform = navigator.platform.toLocaleLowerCase();
            this.useragent = navigator.userAgent.toLocaleLowerCase();
        } catch (err) {
            console.log('could not detect platform');
        }
        document.getElementById('file-upload').addEventListener('change', this.uploadRom.bind(this));
        document.getElementById('file-upload-import').addEventListener('change', this.uploadImport.bind(this));

        this.nes = new Nes();

        this.createDB();
        this.finishedLoading();
        this.initRivets();
        this.detectMobile();

        //when doing rom development
        if (this.romdevMode)
        {
            if (window.location.href.indexOf('localhost')>0){
                setTimeout(() => {
                    (document.getElementById('romselect') as any).selectedIndex = (document.getElementById('romselect') as any).length-3;
                    this.loadRom(); 
                }, 500);
    
                setTimeout(() => {
                    this.nes.PAUSED=true;
                }, 2000);
            }
        }



    }

    initRivets() {
        //init rivets
        rivets.formatters.ev = function (value, arg) {
            // console.log('eval: ' + value + arg);
            return eval(value + arg);
        }
        rivets.formatters.ev_string = function (value, arg) {
            let eval_string = "'" + value + "'" + arg;
            // console.log('eval: ' + eval_string);
            return eval(eval_string);
        }
        rivets.bind(document.getElementsByTagName('body')[0], { data: this });
    }


    saveState(){
        app.nes.saveState();
        if (this.mobileMode)
            this.btnHideMenu();
    }

    loadState(){
        app.nes.loadState();
        if (this.mobileMode)
            this.btnHideMenu();
    }




    async finishedLoading() {
        $('#loadingDiv').hide();
        $('#checkboxSettings').show();
        $('#btnLoadRom').prop("disabled", false);
        $('#btnUploadRom').prop("disabled", false);
        $('#btnLoadDB').prop("disabled", false);
    }


    //needs to be called after
    //user input or button click
    getAudioContext() {
        try {
            this.audioContext = new AudioContext();

        } catch (error) {
            try {
                //try for mobile
                this.audioContext = new window['webkitAudioContext']();
                (this.audioContext as AudioContext).resume();
                console.log('found mobile audio');

                //disable phone locking on mobile devices
                // app.lblStatus = 'No Sleep Enabled';

            } catch (error2) {
                console.log('could not initialize audio');
            }
        }

        if (this.mobileMode){
            var noSleep = new NoSleep();
            noSleep.enable();
        }

        if (this.chkSound)
        {
            this.enableSound();
        }

    }

    enableSound(){
        this.nes.apu.unMuteAll();
        this.nes.apu.initialize(this.audioContext);
    }

    detectMobile(){
        if (window.innerWidth < 600 || this.useragent.toLocaleLowerCase().includes('iphone') ||
        this.useragent.toLocaleLowerCase().includes('ipad') ) {
            this.mobileMode = true;
        }

        //on second thought if it's a big
        //screen then don't do mobile mode
        // if (window.innerWidth > 600)
        //     this.mobileMode = false;

    }

    configEmulator() {
        if (this.chkForceDesktop)
            this.mobileMode = false;
        if (this.chkForceMobile)
            this.mobileMode = true;

        this.getAudioContext();

    }

    loadRom() {

        this.configEmulator();

        //get rom url
        let romurl = 'myasm_game.nes';
        this.rom_name = 'myasm_game.nes';

        //get name
        if (romurl == "Sample Program") {
            this.nes.SAMPLEPROGRAM = true;
            this.nes.memory.mapper = -1; //my own mapper code i'm using for sample program mode
            this.chkDebugChecked = true;
        }


        this.nes_load_url('canvas', romurl);

    }

    uploadBrowse() {
        this.configEmulator();
        document.getElementById('file-upload').click();
    }


    uploadRom(event: Event) {
        this.lblStatus = 'Uploading...';

        var file = (event.currentTarget as any).files[0] as File;
        console.log(file);
        this.rom_name = file.name;
        var reader = new FileReader();
        reader.onprogress = function (e) {
            console.log('loaded: ' + e.loaded);
        };
        reader.onload = function (e) {
            console.log('finished loading');

            app.nes_load_upload('canvas', this.result);

            let romString = this.result as string;
            var ia = new TextEncoder().encode(romString);
            app.saveToDatabase(ia);

        };
        // reader.readAsArrayBuffer(file);
        reader.readAsBinaryString(file)
    }

    saveToDatabase(data: Uint8Array) {

        if (!window["indexedDB"]==undefined){
            console.log('indexedDB not available');
            return;
        }
        
        console.log('save to database called: ', data.length);

        var request = indexedDB.open('NeilNESDB');
        request.onsuccess = function (ev: any) {
            var db = ev.target.result as IDBDatabase;
            var romStore = db.transaction("NESROMS", "readwrite").objectStore("NESROMS");
            var addRequest = romStore.put(data, app.rom_name);
            addRequest.onsuccess = function (event) {
                console.log('data added');
            };
            addRequest.onerror = function (event) {
                console.log('error adding data');
                console.log(event);
            };
        }
    }

    clearDatabase() {

        var request = indexedDB.deleteDatabase('NeilNESDB');
        request.onerror = function (event) {
            console.log("Error deleting database.");
            app.lblStatus = "Error deleting database.";
        };

        request.onsuccess = function (event) {
            console.log("Database deleted successfully");
            app.lblStatus = "Database deleted successfully";
            app.newRom();
        };


    }

    loadFromDatabase() {
        this.configEmulator();
        this.rom_name = document.getElementById('dbselect')["value"];
        if (this.rom_name == 'CLEARCACHE') {
            this.clearDatabase();
            return;
        }

        var request = indexedDB.open('NeilNESDB');
        request.onsuccess = function (ev: any) {
            var db = ev.target.result as IDBDatabase;
            var romStore = db.transaction("NESROMS", "readwrite").objectStore("NESROMS");
            var rom = romStore.get(app.rom_name);
            rom.onsuccess = function (event) {
                let filedata = rom.result as Uint8Array;

                var romString = new TextDecoder().decode(filedata);

                app.nes_load_upload('canvas', romString);

                app.lblStatus = '';
            };
            rom.onerror = function (event) {
                app.lblStatus = 'error getting rom from store';
            }
        }
        request.onerror = function (ev: any) {
            app.lblStatus = 'error loading from db';
        }

    }

    newRom() {
        window.location.reload();
    }

    /* START IMPORT/EXPORT SAVE STATES */
    importDB() {
        document.getElementById('file-upload-import').click();
    }

    uploadImport(event: Event) {

        var file = (event.currentTarget as any).files[0] as File;
        var reader = new FileReader();
        reader.onload = function (e) {
            console.log('finished loading');

            let importString = this.result as string;
            app.importDatabase(importString);
        };
        reader.readAsBinaryString(file);
    }

    importDatabase(importString:string){
        var request = indexedDB.open('NeilNESDB');
        request.onsuccess = function (ev: any) {
            var db = ev.target.result as IDBDatabase;
            let dbexport = new DBExport();
            dbexport.importFromJsonString(db,importString,(error)=>{
                console.log('import complete');
                toastr.info("Save States Imported");
            })
        }
        
    }

    exportDatabase(){
        var request = indexedDB.open('NeilNESDB');
        request.onsuccess = function (ev: any) {
            var db = ev.target.result as IDBDatabase;
            let dbexport = new DBExport();
            let savefilename = app.rom_name + '.sav';
            dbexport.exportToJsonString(db, savefilename,(error,jsonstring)=>{
                console.log('export complete');
                var blob = new Blob([jsonstring], {type: "text/plain;charset=utf-8"});
                saveAs(blob,savefilename);
            })
        }
        
    }
    /* END IMPORT/EXPORT SAVE STATES */


    showCanvasAndInput() {


        //hide controls no longer needed
        $('#hideAfterLoad').hide();
        $('#showAfterLoad').show();

        //height of most games
        // this.canvas.height=224;

        if (this.mobileMode) {
            $("#mobileDiv").show();
            $('#canvas').width(window.innerWidth);
            $('#canvas').appendTo("#mobileCanvas");
            if (this.nes.DEBUGMODE){
                $('#debugpanel').appendTo("#mobileCanvas");
                $('#divDebugButtons').appendTo("#mobileCanvas");
            }
            $("#mainCard").hide();
            $("#mainContainer").hide();
            $("#btnFullScreen").hide();
            $("#btnRemap").hide();
            $("#divZoom").hide();
            $("#btnHidePanel").show();
            $("#btnTurboButtons").show();
            
            let halfWidth = (window.innerWidth / 2) - 35;
            document.getElementById("menuDiv").style.left = halfWidth + "px";
            this.inputController = new InputController('divTouchSurface');

            
            //scroll back to top
			try
			{
				document.body.scrollTop = 0; // For Safari
				document.documentElement.scrollTop = 0; // For Chrome, Firefox, IE and Opera
			}catch(error){}
            

            if (this.nes.DEBUGMODE == false) {
                document.getElementById('canvas').addEventListener('touchstart', function (e) { e.preventDefault(); }, false);
                document.getElementById('canvas').addEventListener('touchend', function (e) { e.preventDefault(); }, false);
                document.getElementById('canvas').addEventListener('touchmove', function (e) { e.preventDefault(); }, false);
            }



        }
        else {
            this.inputController = new InputController();
            let size = localStorage.getItem('nes-size');
            if (size) {
                console.log('size found');
                let sizeNum = parseInt(size);
                this.canvasSize = sizeNum;
            }
            this.resizeCanvas();
            $('#controlsDiv').show();
        }

        //try to load keymappings from localstorage
        try {
            let keymappings = localStorage.getItem('nes_mappings');
            if (keymappings) {
                let keymappings_object = JSON.parse(keymappings);

                //check that it's the new format
                if (keymappings_object.Mapping_Left_2){
                    keymappings = keymappings_object;
                    this.inputController.KeyMappings = keymappings_object;
                }
            }
        } catch (error) { }
        // if (this.rom_name.includes("easy/"))
        //     this.chkDisableGamepad=true;

        this.inputController.DisableGamepad = this.chkDisableGamepad;
        this.inputController.setupGamePad();

        this.nes.inputController = this.inputController;

        $('#mainCard').css("visibility", "visible");
    }

    frameLimiter(){
        if (this.nes.fps_controller.frame_limiter_enabled)
            this.nes.fps_controller.frame_limiter_enabled = false;
        else
            this.nes.fps_controller.frame_limiter_enabled = true;
    }

    canvasDebugSize = 400;

    canvasDebugClick(){
        if (this.canvasDebugSize==400)
            this.canvasDebugSize = 600;
        else
            this.canvasDebugSize = 400;

        $('#canvasDebug').width(this.canvasDebugSize);
    }

    btnTurboButtons(){
        if (this.nes.inputController.TurboButtons)
            this.nes.inputController.TurboButtons = false;
        else
            this.nes.inputController.TurboButtons = true;

        this.btnHideMenu();
    }

    btnMemPrev(){
        this.nes.debugMemPage-=256;
    }

    btnMemNext(){
        this.nes.debugMemPage+=256;
    }

    btnPause() {
        if (this.nes.PAUSED)
        {
            if (this.chkSound)
                this.nes.apu.unMuteAll();
            this.nes.PAUSED = false;
        }
        else
        {
            if (this.chkSound)
                this.nes.apu.muteAll();
            this.nes.PAUSED = true;
        }
    }


    fullScreen() {
        // if (this.nes.DEBUGMODE)
        //     this.nes.canvasDebug.requestFullscreen();
        // else
            this.nes.canvas.requestFullscreen();
    }

    resizeCanvas() {
        console.log('canvas resized');
        $('#canvas').width(this.canvasSize);
        // $('#canvasDebug').width(this.canvasSize);
    }

    btnHideMenu() {
        $('#mainContainer').hide();
        $('#menuDiv').show();
    }

    zoomOut() {

        this.canvasSize -= 50;
        localStorage.setItem('nes-size', this.canvasSize.toString());
        this.resizeCanvas();
    }

    zoomIn() {
        this.canvasSize += 50;
        localStorage.setItem('nes-size', this.canvasSize.toString());
        this.resizeCanvas();
    }

    pressStart(){
        app.nes.inputController.Key_Action_Start = true;
        setTimeout(() => {
            app.nes.inputController.Key_Action_Start = false;
        }, 300);
    }

    square1Enable(){
        if (this.nes.apu.square1.enabled)
            this.nes.apu.square1.disable();
        else
            this.nes.apu.square1.enable();
    }

    square2Enable(){
        if (this.nes.apu.square2.enabled)
            this.nes.apu.square2.disable();
        else
            this.nes.apu.square2.enable();
    }

    triangleEnable(){
        if (this.nes.apu.triangle.enabled)
            this.nes.apu.triangle.disable();
        else
            this.nes.apu.triangle.enable();
    }

    noiseEnable(){
        if (this.nes.apu.noise.enabled)
            this.nes.apu.noise.disable();
        else
            this.nes.apu.noise.enable();
    }

    soundStats(){
        if (this.nes.debugSoundMode)
            this.nes.debugSoundMode=false;
        else
            this.nes.debugSoundMode=true;
    }

    recMusic(){
        if (this.nes.recordMusicMode==false)
            this.nes.startRecordingMusic(); 
        else
            this.nes.stopRecordingMusic();
    }

    stopRec(){
        this.nes.stopRecordingMusic();
    }

    playRec(){
        if (this.nes.playBackMusicMode==false)
            this.nes.playRecordedMusic();
        else
            this.nes.stopPlaybackMusic();
    }


    createDB() {

        if (window["indexedDB"]==undefined){
            console.log('indexedDB not available');
            return;
        }

        var request = indexedDB.open('NeilNESDB');
        request.onupgradeneeded = function (ev: any) {
            console.log('upgrade needed');
            let db = ev.target.result as IDBDatabase;
            let objectStore = db.createObjectStore('NESROMS', { autoIncrement: true });
            objectStore.transaction.oncomplete = function (event) {
                console.log('db created');
            };
        }

        request.onsuccess = function (ev: any) {
            var db = ev.target.result as IDBDatabase;
            var romStore = db.transaction("NESROMS", "readwrite").objectStore("NESROMS");
            try {
                //rewrote using cursor instead of getAllKeys
                //for compatibility with MS EDGE
                romStore.openCursor().onsuccess = function (ev: any) {
                    var cursor = ev.target.result as IDBCursor;
                    if (cursor) {
                        let rom = cursor.key.toString();
                        if (!rom.endsWith('sav'))
                            app.dblist.push(rom);
                        cursor.continue();
                    }
                    else {
                        if (app.dblist.length > 0) {
                            let romselect = document.getElementById('dbselect') as HTMLSelectElement;
                            romselect.selectedIndex = 0;
                            $('#dbContainer').show();
                            $('#btnLoadDB').show();
                        }
                    }
                }

            } catch (error) {
                console.log('error reading keys');
                console.log(error);
            }

        }

    }

    btnDebugViewChr(){
        this.nes.SCREEN_DEBUG.clearScreen();
        this.nes.debug_view_chr = true;
        this.nes.debug_view_nametable = false;
    }

    btnDebugViewNametable(){
        this.nes.SCREEN_DEBUG.clearScreen();
        this.nes.debug_view_chr = false;
        this.nes.debug_view_nametable = true;
    }

    btnSwapNametable(){
        if (this.nes.debugNametable==0)
            this.nes.debugNametable=1;
        else
            this.nes.debugNametable=0;
    }

    btnDisableSprites(){
        if (this.nes.debugDisableSprites)
            this.nes.debugDisableSprites=false;
        else
            this.nes.debugDisableSprites=true;
    }


    remappings: KeyMappings;
    remapMode = '';
    currKey: number;
    currJoy: number;
    chkUseJoypad = false;
    remappingPlayer1:boolean = false;

    showRemapModal() {
        if (this.inputController.Gamepad_Process_Axis)
            // (document.getElementById('chkUseJoypad') as any).checked = true;
            this.chkUseJoypad = true;
        this.remappings = JSON.parse(JSON.stringify(this.inputController.KeyMappings));
        this.remapDefault = true;
        this.remapDefault2 = false;
        this.remapWait = false;
        $("#buttonsModal").modal();
    }

    swapRemapPlayer(){
        if (this.remapDefault){
            this.remapDefault = false;
            this.remapDefault2 = true;
        }else{
            this.remapDefault = true;
            this.remapDefault2 = false;
        }
    }

    

    saveRemap() {
        // if ((document.getElementById('chkUseJoypad') as any).checked)
        if (this.chkUseJoypad)
            this.inputController.Gamepad_Process_Axis = true;
        else
            this.inputController.Gamepad_Process_Axis = false;

        this.inputController.KeyMappings = JSON.parse(JSON.stringify(this.remappings));
        this.inputController.setGamePadButtons();
        localStorage.setItem('nes_mappings', JSON.stringify(this.remappings));
        $("#buttonsModal").modal('hide');
    }

    btnRemapKey(keynum: number) {
        this.currKey = keynum;
        this.remapMode = 'Key';
        this.readyRemap();
    }

    btnRemapJoy(joynum: number) {
        this.currJoy = joynum;
        this.remapMode = 'Button';
        this.readyRemap();
    }

    readyRemap() {
        this.remappingPlayer1 = this.remapDefault;
        this.remapDefault = false;
        this.remapDefault2 = false;
        this.remapWait = true;
        this.inputController.Key_Last = '';
        this.inputController.Joy_Last = null;
        this.inputController.Remap_Check = true;
    }

    remapPressed() {
        if (this.remapMode == 'Key') {
            var keyLast = this.inputController.Key_Last;

            //player 1
            if (this.currKey == 1) this.remappings.Mapping_Up = keyLast;
            if (this.currKey == 2) this.remappings.Mapping_Down = keyLast;
            if (this.currKey == 3) this.remappings.Mapping_Left = keyLast;
            if (this.currKey == 4) this.remappings.Mapping_Right = keyLast;
            if (this.currKey == 5) this.remappings.Mapping_Action_A = keyLast;
            if (this.currKey == 6) this.remappings.Mapping_Action_B = keyLast;
            if (this.currKey == 8) this.remappings.Mapping_Action_Start = keyLast;
            if (this.currKey == 7) this.remappings.Mapping_Action_Select = keyLast;

            //player 2
            if (this.currKey == 11) this.remappings.Mapping_Up_2 = keyLast;
            if (this.currKey == 12) this.remappings.Mapping_Down_2 = keyLast;
            if (this.currKey == 13) this.remappings.Mapping_Left_2 = keyLast;
            if (this.currKey == 14) this.remappings.Mapping_Right_2 = keyLast;
            if (this.currKey == 15) this.remappings.Mapping_Action_A_2 = keyLast;
            if (this.currKey == 16) this.remappings.Mapping_Action_B_2 = keyLast;
            if (this.currKey == 18) this.remappings.Mapping_Action_Start_2 = keyLast;
            if (this.currKey == 17) this.remappings.Mapping_Action_Select_2 = keyLast;
        }
        if (this.remapMode == 'Button') {
            var joyLast = this.inputController.Joy_Last;
            if (this.currJoy == 1) this.remappings.Joy_Mapping_Up = joyLast;
            if (this.currJoy == 2) this.remappings.Joy_Mapping_Down = joyLast;
            if (this.currJoy == 3) this.remappings.Joy_Mapping_Left = joyLast;
            if (this.currJoy == 4) this.remappings.Joy_Mapping_Right = joyLast;
            if (this.currJoy == 5) this.remappings.Joy_Mapping_Action_A = joyLast;
            if (this.currJoy == 6) this.remappings.Joy_Mapping_Action_B = joyLast;
            if (this.currJoy == 8) this.remappings.Joy_Mapping_Action_Start = joyLast;
            if (this.currJoy == 7) this.remappings.Joy_Mapping_Action_Select = joyLast;
        }
        this.remapDefault = this.remappingPlayer1;
        this.remapDefault2 = !this.remappingPlayer1;
        this.remapWait = false;
    }

    nes_init() {

        if (this.chkDebugChecked)
            app.nes.DEBUGMODE = true;
        else
            app.nes.DEBUGMODE = false;
        app.nes.initCanvases();

    }
    

    onAnimationFrame() {

        window.requestAnimationFrame(app.onAnimationFrame);

        //run a single frame
        app.nes.frame();

    }

    nes_boot(rom_data) {

        app.showCanvasAndInput();
        app.nes.loadROM(rom_data, this.rom_name);



        window.requestAnimationFrame(app.onAnimationFrame);
    }

    nes_load_upload(canvas_id, rom_data) {
        app.nes_init();
        app.nes_boot(rom_data);
    }

    
    async nes_load_url(canvas_id, path) {
        app.nes_init();
        console.log('loading ' + path);

        //the overrideMimeType is the key
        //and you NEED both text/plain and the charset
        //otherwise jquery wouldve worked as well
        // var responseText = await $.ajax({
        //     url: path,
        //     beforeSend: function( xhr ) {
        //       xhr.overrideMimeType( "text/plain; charset=x-user-defined" );
        //     }
        //   }) as string;
        // app.nes_boot(responseText);
        
        var req = new XMLHttpRequest();
        req.open("GET", path);
        req.overrideMimeType("text/plain; charset=x-user-defined");
        req.onerror = () => console.log(`Error loading ${path}: ${req.statusText}`);

        req.onload = function () {
            if (this.status === 200) {
                app.nes_boot(this.responseText);
            } else if (this.status === 0) {
                // Aborted, so ignore error
            } else {
                // req.onerror();
                // console.log('error');
            }
        };

        req.send();
    }

}




app = new MyApp();

window["myApp"] = app;

