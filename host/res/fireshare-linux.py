import asyncio
import websockets
import json
from evdev import UInput, AbsInfo, ecodes as e

async def handle_message(websocket, path):
    cap = {
        e.EV_KEY: [
            e.BTN_A,
            e.BTN_B,
            e.BTN_X,
            e.BTN_Y,
            e.BTN_DPAD_UP,
            e.BTN_DPAD_DOWN,
            e.BTN_DPAD_LEFT,
            e.BTN_DPAD_RIGHT,
            e.BTN_TL,
            e.BTN_TR,
            e.BTN_TL2,
            e.BTN_TR2,
            e.BTN_SELECT,
            e.BTN_START,
            e.BTN_THUMB,
            e.BTN_THUMB2
        ],
        e.EV_ABS: [
            (e.ABS_X, AbsInfo(value=0, fuzz=0, flat=0, resolution=0, min=-256, max=255)),
            (e.ABS_Y, AbsInfo(value=0, fuzz=0, flat=0, resolution=0, min=-256, max=255)),
            (e.ABS_RX, AbsInfo(value=0, fuzz=0, flat=0, resolution=0, min=-256, max=255)),
            (e.ABS_RY, AbsInfo(value=0, fuzz=0, flat=0, resolution=0, min=-256, max=255))
        ]
    }
    
    controllers = dict()
    
    async for message in websocket:
        data = json.loads(message)
        user = data["id"]
        
        if not (user in controllers):
          ui = UInput(cap, name="Website Controller")
          ui.syn()
          controllers[user] = ui
        
        ui = controllers[user]
        
        if "down" in data:
          print(str(user) + " pressed " + str(data["down"]))
        
        if "up" in data:
          print(str(user) + " released " + str(data["up"]))
        
        if "gyro" in data:
          # handle gyro data here (device rotation, array of 3 numbers)
          pass
        
        if "buttons" in data:
          A, B, X, Y, L1, R1, L2, R2, SELECT, START, LTHUMB, RTHUMB, UP, DOWN, LEFT, RIGHT, HOME = data["buttons"]
          
          ui.write(e.EV_KEY, e.BTN_A, A)
          ui.write(e.EV_KEY, e.BTN_B, B)
          ui.write(e.EV_KEY, e.BTN_X, X)
          ui.write(e.EV_KEY, e.BTN_Y, Y)
          ui.write(e.EV_KEY, e.BTN_SELECT, SELECT)
          ui.write(e.EV_KEY, e.BTN_START, START)
          ui.write(e.EV_KEY, e.BTN_DPAD_UP, UP)
          ui.write(e.EV_KEY, e.BTN_DPAD_DOWN, DOWN)
          ui.write(e.EV_KEY, e.BTN_DPAD_LEFT, LEFT)
          ui.write(e.EV_KEY, e.BTN_DPAD_RIGHT, RIGHT)
          ui.write(e.EV_KEY, e.BTN_TL, L1)
          ui.write(e.EV_KEY, e.BTN_TR, R1)
          ui.write(e.EV_KEY, e.BTN_TL2, round(L2))
          ui.write(e.EV_KEY, e.BTN_TR2, round(R2))
          ui.write(e.EV_KEY, e.BTN_THUMB, LTHUMB)
          ui.write(e.EV_KEY, e.BTN_THUMB2, RTHUMB)
        if "axes" in data:
          L_RIGHT, L_DOWN, R_RIGHT, R_DOWN = data["axes"]
          
          ui.write(e.EV_ABS, e.ABS_X, round(L_RIGHT * 255))
          ui.write(e.EV_ABS, e.ABS_Y, round(L_DOWN * 255))
          ui.write(e.EV_ABS, e.ABS_RX, round(R_RIGHT * 255))
          ui.write(e.EV_ABS, e.ABS_RY, round(R_DOWN * 255))
          
        ui.syn()
        
        if "close" in data:
          ui.close()
          del controllers[user]
    
    for user in controllers:
      controllers[user].close()
    
    try:
        websocket.close()
    except Exception:
        pass

start_server = websockets.serve(handle_message, "localhost", 6731)

asyncio.get_event_loop().run_until_complete(start_server)
asyncio.get_event_loop().run_forever()
