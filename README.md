# key-press-analyser
simple node application to analyse key presses for analysis to design keyboard layouts


## run 

determine the current keyboard id with

```sh
✔ ~/Development/keypress
 [feature/process-while-typing|✔] $ xinput
⎡ Virtual core pointer                    	id=2	[master pointer  (3)]
⎜   ↳ Virtual core XTEST pointer              	id=4	[slave  pointer  (2)]
⎜   ↳ Logitech MX Master                      	id=15	[slave  pointer  (2)]
⎜   ↳ SynPS/2 Synaptics TouchPad              	id=18	[slave  pointer  (2)]
⎜   ↳ ELAN Touchscreen                        	id=14	[slave  pointer  (2)]
⎣ Virtual core keyboard                   	id=3	[master keyboard (2)]
    ↳ Virtual core XTEST keyboard             	id=5	[slave  keyboard (3)]
    ↳ Power Button                            	id=6	[slave  keyboard (3)]
    ↳ Video Bus                               	id=7	[slave  keyboard (3)]
    ↳ Video Bus                               	id=8	[slave  keyboard (3)]
    ↳ Power Button                            	id=9	[slave  keyboard (3)]
    ↳ Sleep Button                            	id=10	[slave  keyboard (3)]
    ↳ Integrated_Webcam_HD: Integrate         	id=11	[slave  keyboard (3)]
    ↳ HOLDCHIP USB Gaming Keyboard            	id=12	[slave  keyboard (3)]
    ↳ HOLDCHIP USB Gaming Keyboard            	id=13	[slave  keyboard (3)]
    ↳ Dell WMI hotkeys                        	id=16	[slave  keyboard (3)]
    ↳ AT Translated Set 2 keyboard            	id=17	[slave  keyboard (3)]
    ↳ Logitech MX Master                      	id=19	[slave  keyboard (3)]
```

```sh
npm start -- -f test.log -i 12
```


## ideas

- dynamically test for keyboard id.
    > if no -i argument show the output of `xinput list` and ask user to enter the likely code with instructions to type elsewhere, then confirm that input is coming
- generate stats via web or cli interface as the use types    
