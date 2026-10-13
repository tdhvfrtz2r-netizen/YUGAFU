# Named camera set shared by stills and video.
from present import camera
def make_views():
    v = {}
    v['dollhouse_window'] = camera('dollhouse_window', (6.2,-8.0,7.4), (0,0.2,0.6), lens=42)
    v['dollhouse_door']   = camera('dollhouse_door', (-6.2,8.0,7.4), (0,-0.2,0.6), lens=42)
    v['dollhouse_c3']     = camera('dollhouse_c3', (6.6,7.6,7.2), (0,-0.2,0.6), lens=42)
    v['dollhouse_c4']     = camera('dollhouse_c4', (-6.6,-7.6,7.2), (0,0.2,0.6), lens=42)
    v['section']          = camera('section', (10.5,0.0,4.2), (0,0,1.25), lens=40)
    v['plan']             = camera('plan', (0,0,12), (0,0,0), ortho=6.9)
    v['inside_to_window'] = camera('inside_to_window', (0.25,-2.55,1.55), (-0.2,3.0,1.2), lens=14)
    v['inside_corner']    = camera('inside_corner', (1.2,-2.4,2.3), (-1.2,1.8,0.6), lens=16)
    v['inside_to_door']   = camera('inside_to_door', (0.0,1.0,1.5), (0.0,-3.0,1.1), lens=18)
    return v
