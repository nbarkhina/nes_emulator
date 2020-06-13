define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class GamePadState {
        constructor(buttonNum, keyName) {
            this.buttonDown = false;
            this.buttonNum = -1;
            this.buttonTimer = 0;
            this.keyName = '';
            this.buttonNum = buttonNum;
            this.keyName = keyName;
        }
    }
    exports.GamePadState = GamePadState;
    class KeyMappings {
        constructor() {
            this.Mapping_Left = null;
            this.Mapping_Right = null;
            this.Mapping_Up = null;
            this.Mapping_Down = null;
            this.Mapping_Action_Start = null;
            this.Mapping_Action_Select = null;
            this.Mapping_Action_B = null;
            this.Mapping_Action_A = null;
            this.Mapping_Left_2 = null;
            this.Mapping_Right_2 = null;
            this.Mapping_Up_2 = null;
            this.Mapping_Down_2 = null;
            this.Mapping_Action_Start_2 = null;
            this.Mapping_Action_Select_2 = null;
            this.Mapping_Action_B_2 = null;
            this.Mapping_Action_A_2 = null;
            this.Joy_Mapping_Left = null;
            this.Joy_Mapping_Right = null;
            this.Joy_Mapping_Up = null;
            this.Joy_Mapping_Down = null;
            this.Joy_Mapping_Action_Start = null;
            this.Joy_Mapping_Action_Select = null;
            this.Joy_Mapping_Action_B = null;
            this.Joy_Mapping_Action_A = null;
        }
    }
    exports.KeyMappings = KeyMappings;
    class InputController {
        constructor(touch_element_id, touch_exclude_id) {
            this.gamepadButtons = [];
            //for remapping
            this.Key_Last = '';
            this.Joy_Last = null;
            this.Remap_Check = false;
            //controller 1
            this.Key_Up = false;
            this.Key_Down = false;
            this.Key_Left = false;
            this.Key_Right = false;
            this.Key_Action_Start = false;
            this.Key_Action_Select = false;
            this.Key_Action_B = false;
            this.Key_Action_A = false;
            //controller 2
            this.Key_Up_2 = false;
            this.Key_Down_2 = false;
            this.Key_Left_2 = false;
            this.Key_Right_2 = false;
            this.Key_Action_Start_2 = false;
            this.Key_Action_Select_2 = false;
            this.Key_Action_B_2 = false;
            this.Key_Action_A_2 = false;
            this.Gamepad_Process_Axis = false;
            this.Touch_Tap = false;
            this.DebugKeycodes = false;
            this.Code_Right = 2000;
            this.Code_Left = 2001;
            this.Code_Down = 2002;
            this.Code_Up = 2003;
            this.Code_A = 2006;
            this.Code_B = 2007;
            this.Code_Start = 2009;
            this.Code_Select = 2008;
            this.MobileA = false;
            this.MobileA_Counter = 0;
            this.MobileB = false;
            this.MobileB_Counter = 0;
            this.MobileStart = false;
            this.MobileStart_Counter = 0;
            this.MobileSelect = false;
            this.MobileSelect_Counter = 0;
            this.TurboButtons = true;
            this.DisableGamepad = false;
            //touch
            this.touchX_Start = 0;
            this.touchY_Start = 0;
            this.touch_tap_counter = 0;
            window["inputController"] = this;
            //need this for full screen touch support
            if (touch_element_id) {
                //you have to do this if there are any html buttons that need to be pressed
                if (touch_exclude_id) {
                    document.getElementById(touch_exclude_id).addEventListener('touchstart', function (e) { e.stopPropagation(); }, false);
                    document.getElementById(touch_exclude_id).addEventListener('touchend', function (e) { e.stopPropagation(); }, false);
                }
                document.getElementById(touch_element_id).addEventListener('touchstart', this.touchStart, false);
                document.getElementById(touch_element_id).addEventListener('touchend', this.touchEnd, false);
                document.getElementById(touch_element_id).addEventListener('touchmove', this.touchMove, false);
                document.getElementById('mobileA').addEventListener('touchstart', this.mobilePressA.bind(this), false);
                document.getElementById('mobileB').addEventListener('touchstart', this.mobilePressB.bind(this), false);
                document.getElementById('mobileStart').addEventListener('touchstart', this.mobilePressStart.bind(this), false);
                document.getElementById('mobileSelect').addEventListener('touchstart', this.mobilePressSelect.bind(this), false);
                document.getElementById('mobileA').addEventListener('touchend', this.mobileReleaseA.bind(this), false);
                document.getElementById('mobileB').addEventListener('touchend', this.mobileReleaseB.bind(this), false);
                document.getElementById('mobileStart').addEventListener('touchend', this.mobileReleaseStart.bind(this), false);
                document.getElementById('mobileSelect').addEventListener('touchend', this.mobileReleaseSelect.bind(this), false);
                document.getElementById('mobileA').addEventListener('touchmove', function (e) { e.preventDefault(); }, false);
                document.getElementById('mobileB').addEventListener('touchmove', function (e) { e.preventDefault(); }, false);
                document.getElementById('mobileStart').addEventListener('touchmove', function (e) { e.preventDefault(); }, false);
                document.getElementById('mobileSelect').addEventListener('touchmove', function (e) { e.preventDefault(); }, false);
                //to hide and show loading panel
                document.getElementById('menuDiv').addEventListener('touchstart', this.canvasTouch.bind(this), false);
            }
            this.KeyMappings = {
                Mapping_Left: 'ArrowLeft',
                Mapping_Right: 'ArrowRight',
                Mapping_Up: 'ArrowUp',
                Mapping_Down: 'ArrowDown',
                Mapping_Action_A: 's',
                Mapping_Action_B: 'a',
                Mapping_Action_Start: 'Enter',
                Mapping_Action_Select: '/',
                Mapping_Left_2: 'd',
                Mapping_Right_2: 'g',
                Mapping_Up_2: 'r',
                Mapping_Down_2: 'f',
                Mapping_Action_A_2: 'k',
                Mapping_Action_B_2: 'l',
                Mapping_Action_Start_2: 'o',
                Mapping_Action_Select_2: "p",
                Joy_Mapping_Left: 14,
                Joy_Mapping_Right: 15,
                Joy_Mapping_Down: 13,
                Joy_Mapping_Up: 12,
                Joy_Mapping_Action_A: 0,
                Joy_Mapping_Action_B: 2,
                Joy_Mapping_Action_Start: 9,
                Joy_Mapping_Action_Select: 8
            };
            // use default snes implementation for keyboard
            document.onkeydown = this.keyDown;
            document.onkeyup = this.keyUp;
        }
        canvasTouch(event) {
            if (event.touches[0].clientY < 50)
                $("#mainContainer").show();
            $('#menuDiv').hide();
        }
        mobilePressA(event) {
            event.preventDefault();
            this.Key_Action_A = true;
            this.MobileA = true;
        }
        mobilePressB(event) {
            event.preventDefault();
            this.Key_Action_B = true;
            this.MobileB = true;
        }
        mobilePressStart(event) {
            event.preventDefault();
            this.Key_Action_Start = true;
            this.MobileStart = true;
        }
        mobilePressSelect(event) {
            event.preventDefault();
            this.Key_Action_Select = true;
            this.MobileSelect = true;
        }
        mobileReleaseA(event) {
            event.preventDefault();
            if (this.TurboButtons == false && this.MobileA_Counter <= 15) {
                //don't do sticky buttons
            }
            else {
                this.MobileA = false;
                this.Key_Action_A = false;
                this.MobileA_Counter = 0;
            }
        }
        mobileReleaseB(event) {
            event.preventDefault();
            if (this.TurboButtons == false && this.MobileB_Counter <= 15) {
                //don't do sticky buttons
            }
            else {
                this.MobileB = false;
                this.Key_Action_B = false;
                this.MobileB_Counter = 0;
            }
        }
        mobileReleaseStart(event) {
            event.preventDefault();
            this.MobileStart = false;
            this.Key_Action_Start = false;
            this.MobileStart_Counter = 0;
        }
        mobileReleaseSelect(event) {
            event.preventDefault();
            this.MobileSelect = false;
            this.Key_Action_Select = false;
            this.MobileSelect_Counter = 0;
        }
        setupGamePad() {
            if (this.DisableGamepad)
                return;
            window.addEventListener("gamepadconnected", this.initGamePad.bind(this));
            this.setGamePadButtons();
        }
        setGamePadButtons() {
            this.gamepadButtons = [];
            this.gamepadButtons.push(new GamePadState(this.KeyMappings.Joy_Mapping_Left, this.KeyMappings.Mapping_Left));
            this.gamepadButtons.push(new GamePadState(this.KeyMappings.Joy_Mapping_Right, this.KeyMappings.Mapping_Right));
            this.gamepadButtons.push(new GamePadState(this.KeyMappings.Joy_Mapping_Down, this.KeyMappings.Mapping_Down));
            this.gamepadButtons.push(new GamePadState(this.KeyMappings.Joy_Mapping_Up, this.KeyMappings.Mapping_Up));
            this.gamepadButtons.push(new GamePadState(this.KeyMappings.Joy_Mapping_Action_Start, this.KeyMappings.Mapping_Action_Start));
            this.gamepadButtons.push(new GamePadState(this.KeyMappings.Joy_Mapping_Action_B, this.KeyMappings.Mapping_Action_B));
            this.gamepadButtons.push(new GamePadState(this.KeyMappings.Joy_Mapping_Action_Select, this.KeyMappings.Mapping_Action_Select));
            this.gamepadButtons.push(new GamePadState(this.KeyMappings.Joy_Mapping_Action_A, this.KeyMappings.Mapping_Action_A));
        }
        initGamePad(e) {
            try {
                if (e.gamepad.buttons.length > 0) {
                    // this.message = '<b>Gamepad Detected:</b><br>' + e.gamepad.id;
                }
            }
            catch (_a) { }
            console.log("Gamepad connected at index %d: %s. %d buttons, %d axes.", e.gamepad.index, e.gamepad.id, e.gamepad.buttons.length, e.gamepad.axes.length);
        }
        processGamepad() {
            try {
                var gamepads = navigator.getGamepads ? navigator.getGamepads() : (navigator.webkitGetGamepads ? navigator.webkitGetGamepads : []);
                if (!gamepads)
                    return;
                var gp = null;
                for (let i = 0; i < gamepads.length; i++) {
                    if (gamepads[i] && gamepads[i].buttons.length > 0)
                        gp = gamepads[i];
                }
                if (gp) {
                    for (let i = 0; i < gp.buttons.length; i++) {
                        if (this.DebugKeycodes) {
                            if (gp.buttons[i].pressed)
                                console.log(i);
                        }
                        if (gp.buttons[i].pressed)
                            this.Joy_Last = i;
                    }
                    this.gamepadButtons.forEach(button => {
                        if (gp.buttons[button.buttonNum].pressed) {
                            if (button.buttonTimer == 0) {
                                this.sendKeyDownEvent(button.keyName);
                            }
                            button.buttonDown = true;
                            button.buttonTimer++;
                        }
                        else if (button.buttonDown) {
                            if (!gp.buttons[button.buttonNum].pressed) {
                                button.buttonDown = false;
                                button.buttonTimer = 0;
                                this.sendKeyUpEvent(button.keyName);
                            }
                        }
                    });
                    //process axes
                    if (this.Gamepad_Process_Axis) {
                        try {
                            let horiz_axis = gp.axes[0];
                            let vertical_axis = gp.axes[1];
                            if (horiz_axis < -.5) {
                                if (!this.Key_Left) {
                                    this.sendKeyDownEvent(this.KeyMappings.Mapping_Left);
                                }
                            }
                            else {
                                if (this.Key_Left) {
                                    this.sendKeyUpEvent(this.KeyMappings.Mapping_Left);
                                }
                            }
                            if (horiz_axis > .5) {
                                if (!this.Key_Right) {
                                    this.sendKeyDownEvent(this.KeyMappings.Mapping_Right);
                                }
                            }
                            else {
                                if (this.Key_Right) {
                                    this.sendKeyUpEvent(this.KeyMappings.Mapping_Right);
                                }
                            }
                            if (vertical_axis > .5) {
                                if (!this.Key_Down) {
                                    this.sendKeyDownEvent(this.KeyMappings.Mapping_Down);
                                }
                            }
                            else {
                                if (this.Key_Down) {
                                    this.sendKeyUpEvent(this.KeyMappings.Mapping_Down);
                                }
                            }
                            if (vertical_axis < -.5) {
                                if (!this.Key_Up) {
                                    this.sendKeyDownEvent(this.KeyMappings.Mapping_Up);
                                }
                            }
                            else {
                                if (this.Key_Up) {
                                    this.sendKeyUpEvent(this.KeyMappings.Mapping_Up);
                                }
                            }
                        }
                        catch (error) { }
                    }
                }
            }
            catch (_a) { }
        }
        sendKeyDownEvent(key) {
            let keyEvent = new KeyboardEvent('Gamepad Event Down', { key: key });
            this.keyDown(keyEvent);
        }
        sendKeyUpEvent(key) {
            let keyEvent = new KeyboardEvent('Gamepad Event Up', { key: key });
            this.keyUp(keyEvent);
        }
        keyDown(event) {
            let input_controller = window["inputController"];
            input_controller.Key_Last = event.key;
            if (input_controller.DebugKeycodes)
                console.log(event);
            //handle certain keyboards that use Left instead of ArrowLeft
            if (event.key == 'Left' && input_controller.KeyMappings.Mapping_Left == 'ArrowLeft')
                event = new KeyboardEvent('', { key: 'ArrowLeft' });
            if (event.key == 'Right' && input_controller.KeyMappings.Mapping_Right == 'ArrowRight')
                event = new KeyboardEvent('', { key: 'ArrowRight' });
            if (event.key == 'Up' && input_controller.KeyMappings.Mapping_Up == 'ArrowUp')
                event = new KeyboardEvent('', { key: 'ArrowUp' });
            if (event.key == 'Down' && input_controller.KeyMappings.Mapping_Down == 'ArrowDown')
                event = new KeyboardEvent('', { key: 'ArrowDown' });
            let arrowkey = false;
            //player 1
            if (event.key == input_controller.KeyMappings.Mapping_Down) {
                input_controller.Key_Down = true;
                arrowkey = true;
            }
            if (event.key == input_controller.KeyMappings.Mapping_Up) {
                input_controller.Key_Up = true;
                arrowkey = true;
            }
            if (event.key == input_controller.KeyMappings.Mapping_Left) {
                input_controller.Key_Left = true;
                arrowkey = true;
            }
            if (event.key == input_controller.KeyMappings.Mapping_Right) {
                input_controller.Key_Right = true;
                arrowkey = true;
            }
            if (event.key == input_controller.KeyMappings.Mapping_Action_Start) {
                input_controller.Key_Action_Start = true;
            }
            if (event.key == input_controller.KeyMappings.Mapping_Action_B) {
                input_controller.Key_Action_B = true;
            }
            if (event.key == input_controller.KeyMappings.Mapping_Action_Select) {
                input_controller.Key_Action_Select = true;
            }
            if (event.key == input_controller.KeyMappings.Mapping_Action_A) {
                input_controller.Key_Action_A = true;
            }
            //player 2
            if (event.key == input_controller.KeyMappings.Mapping_Down_2) {
                input_controller.Key_Down_2 = true;
            }
            if (event.key == input_controller.KeyMappings.Mapping_Up_2) {
                input_controller.Key_Up_2 = true;
            }
            if (event.key == input_controller.KeyMappings.Mapping_Left_2) {
                input_controller.Key_Left_2 = true;
            }
            if (event.key == input_controller.KeyMappings.Mapping_Right_2) {
                input_controller.Key_Right_2 = true;
            }
            if (event.key == input_controller.KeyMappings.Mapping_Action_Start_2) {
                input_controller.Key_Action_Start_2 = true;
            }
            if (event.key == input_controller.KeyMappings.Mapping_Action_B_2) {
                input_controller.Key_Action_B_2 = true;
            }
            if (event.key == input_controller.KeyMappings.Mapping_Action_Select_2) {
                input_controller.Key_Action_Select_2 = true;
            }
            if (event.key == input_controller.KeyMappings.Mapping_Action_A_2) {
                input_controller.Key_Action_A_2 = true;
            }
            //prevent page scrolling
            if (arrowkey && event.preventDefault)
                event.preventDefault();
        }
        keyUp(event) {
            let input_controller = window["inputController"];
            //handle certain keyboards that use Left instead of ArrowLeft
            if (event.key == 'Left' && input_controller.KeyMappings.Mapping_Left == 'ArrowLeft')
                event = new KeyboardEvent('', { key: 'ArrowLeft' });
            if (event.key == 'Right' && input_controller.KeyMappings.Mapping_Right == 'ArrowRight')
                event = new KeyboardEvent('', { key: 'ArrowRight' });
            if (event.key == 'Up' && input_controller.KeyMappings.Mapping_Up == 'ArrowUp')
                event = new KeyboardEvent('', { key: 'ArrowUp' });
            if (event.key == 'Down' && input_controller.KeyMappings.Mapping_Down == 'ArrowDown')
                event = new KeyboardEvent('', { key: 'ArrowDown' });
            //player 1
            if (event.key == input_controller.KeyMappings.Mapping_Down) {
                input_controller.Key_Down = false;
            }
            if (event.key == input_controller.KeyMappings.Mapping_Up) {
                input_controller.Key_Up = false;
            }
            if (event.key == input_controller.KeyMappings.Mapping_Left) {
                input_controller.Key_Left = false;
            }
            if (event.key == input_controller.KeyMappings.Mapping_Right) {
                input_controller.Key_Right = false;
            }
            if (event.key == input_controller.KeyMappings.Mapping_Action_Start) {
                input_controller.Key_Action_Start = false;
            }
            if (event.key == input_controller.KeyMappings.Mapping_Action_B) {
                input_controller.Key_Action_B = false;
            }
            if (event.key == input_controller.KeyMappings.Mapping_Action_Select) {
                input_controller.Key_Action_Select = false;
            }
            if (event.key == input_controller.KeyMappings.Mapping_Action_A) {
                input_controller.Key_Action_A = false;
            }
            //player 2
            if (event.key == input_controller.KeyMappings.Mapping_Down_2) {
                input_controller.Key_Down_2 = false;
            }
            if (event.key == input_controller.KeyMappings.Mapping_Up_2) {
                input_controller.Key_Up_2 = false;
            }
            if (event.key == input_controller.KeyMappings.Mapping_Left_2) {
                input_controller.Key_Left_2 = false;
            }
            if (event.key == input_controller.KeyMappings.Mapping_Right_2) {
                input_controller.Key_Right_2 = false;
            }
            if (event.key == input_controller.KeyMappings.Mapping_Action_Start_2) {
                input_controller.Key_Action_Start_2 = false;
            }
            if (event.key == input_controller.KeyMappings.Mapping_Action_B_2) {
                input_controller.Key_Action_B_2 = false;
            }
            if (event.key == input_controller.KeyMappings.Mapping_Action_Select_2) {
                input_controller.Key_Action_Select_2 = false;
            }
            if (event.key == input_controller.KeyMappings.Mapping_Action_A_2) {
                input_controller.Key_Action_A_2 = false;
            }
        }
        touchStart(event) {
            event.preventDefault();
            let input_controller = window["inputController"];
            //prevent multi-touch from grabbing the wrong touch event
            //there may be more than 2 touches so just loop until it's found
            for (let i = 0; i < event.touches.length; i++) {
                let touch = event.touches[i];
                if (touch.target["id"] == "divTouchSurface" || touch.target["id"] == "startDiv") {
                    input_controller.touchX_Start = touch.clientX;
                    input_controller.touchY_Start = touch.clientY;
                }
            }
        }
        touchMove(event) {
            event.preventDefault();
            let input_controller = window["inputController"];
            //prevent multi-touch from grabbing the wrong touch event
            for (let i = 0; i < event.touches.length; i++) {
                let touch = event.touches[i];
                if (touch.target["id"] == "divTouchSurface" || touch.target["id"] == "startDiv") {
                    var amount_horizontal = touch.clientX - input_controller.touchX_Start;
                    var amount_vertical = touch.clientY - input_controller.touchY_Start;
                    if (amount_horizontal > 10) {
                        if (!input_controller.Key_Right) {
                            input_controller.sendKeyDownEvent(input_controller.KeyMappings.Mapping_Right);
                            input_controller.Key_Right = true;
                        }
                    }
                    if (amount_horizontal < -10) {
                        if (!input_controller.Key_Left) {
                            input_controller.sendKeyDownEvent(input_controller.KeyMappings.Mapping_Left);
                            input_controller.Key_Left = true;
                        }
                    }
                    if (amount_vertical > 10) {
                        //mario hack
                        if (!input_controller.Key_Down) {
                            input_controller.sendKeyDownEvent(input_controller.KeyMappings.Mapping_Down);
                            input_controller.Key_Down = true;
                        }
                    }
                    if (amount_vertical < -10) {
                        if (!input_controller.Key_Up) {
                            input_controller.sendKeyDownEvent(input_controller.KeyMappings.Mapping_Up);
                            input_controller.Key_Up = true;
                        }
                    }
                }
            }
        }
        touchEnd(event) {
            event.preventDefault();
            event.stopPropagation();
            let input_controller = window["inputController"];
            if (input_controller.Key_Left == false && input_controller.Key_Right == false
                && input_controller.Key_Down == false && input_controller.Key_Up == false)
                input_controller.Touch_Tap = true;
            if (input_controller.Key_Right) {
                input_controller.sendKeyUpEvent(input_controller.KeyMappings.Mapping_Right);
                input_controller.Key_Right = false;
            }
            if (input_controller.Key_Left) {
                input_controller.sendKeyUpEvent(input_controller.KeyMappings.Mapping_Left);
                input_controller.Key_Left = false;
            }
            if (input_controller.Key_Up) {
                input_controller.sendKeyUpEvent(input_controller.KeyMappings.Mapping_Up);
                input_controller.Key_Up = false;
            }
            if (input_controller.Key_Down) {
                input_controller.sendKeyUpEvent(input_controller.KeyMappings.Mapping_Down);
                input_controller.Key_Down = false;
            }
        }
        update() {
            if (this.DisableGamepad == false)
                this.processGamepad();
            if (this.Touch_Tap) {
                this.touch_tap_counter++;
            }
            if (this.touch_tap_counter > 1) {
                this.Touch_Tap = false;
                this.touch_tap_counter = 0;
            }
            //used for double tap detection
            this.MobileA_Counter++;
            this.MobileB_Counter++;
            this.MobileStart_Counter++;
            this.MobileSelect_Counter++;
            //a hack - need to refactor
            if (this.Remap_Check) {
                if (this.Key_Last != '' || this.Joy_Last) {
                    window["myApp"].remapPressed();
                    this.Remap_Check = false;
                }
            }
        }
    }
    exports.InputController = InputController;
});
//# sourceMappingURL=input_controller.js.map