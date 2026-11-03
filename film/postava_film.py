"""
Postava "Ela" – stylizovaná 3D postavička + animace pro krátký film (Blender 4.x / 5.x).
Stejný styl i ovládání jako robot_film.py.

Použití:
  GUI:     Blender -> Scripting -> Open -> postava_film.py -> Run Script
  Render:  blender -b -P postava_film.py -- --render          (film/render/ela.mp4)
  Náhled:  blender -b -P postava_film.py -- --render --preview
  Export:  blender -b -P postava_film.py -- --glb             (film/render/ela.glb)

Výchozí je celý film (20 s) = rozcvička + pózy, mezi nimi střih kamery.
Jednotlivou scénu postavíš přepnutím SCENA níže (nebo -- --scena=pozy).

Rozcvička (10 s, 24 fps):
  0–1.2 s   stojí, dýchá, mrkne
  1.2–3.3 s protáhne se – zvedne obě ruce nad hlavu, stoupne na špičky
  3.5–5.5 s dvakrát skočí panáka (ruce nahoru, nohy od sebe)
  5.7–7.7 s otočí se dokola s rozpaženýma rukama
  7.8–9.2 s rozkročí se a zamává
  9.2–10 s  vrátí se do klidu a nakloní hlavu

Pózy (10 s):
  0–2.5 s   ruce vztyčené nad hlavu, pohled vzhůru
  2.5–4.7 s pomalá otočka bokem a zády s rukama nahoře
  4.7–5.8 s zády ke kameře ruce do V, ohlédnutí
  5.8–8.8 s otočka zpět a dřep s rukama nahoře (kamera shora)
  8.8–10 s  zvednutí a návrat do klidu
"""

import math
import os
import sys

import bpy

FPS = 24
END = 240
OUT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "render")

argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
DO_RENDER = "--render" in argv
DO_GLB = "--glb" in argv
PREVIEW = "--preview" in argv

# Která scéna se má postavit:
#   "film"       – obě scény za sebou (rozcvička, pak pózy), 20 s
#   "pozy"       – sestava póz: ruce nad hlavu, otočka bokem/zády, ruce do V, dřep (kamera shora)
#   "rozcvicka"  – protažení, panák, otočka, mávání
SCENA = "film"
for a in argv:
    if a.startswith("--scena="):
        SCENA = a.split("=", 1)[1]

# barvy (R, G, B od 0 do 1) – tady si postavu snadno přebarvíš
SKIN = (0.93, 0.70, 0.55)
HAIR = (0.95, 0.75, 0.35)
SHIRT = (0.10, 0.65, 0.65)
PANTS = (0.30, 0.18, 0.45)
SHOES = (0.95, 0.95, 0.95)


# ---------------------------------------------------------------- pomocníci
def clear_scene():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete()
    for coll in (bpy.data.meshes, bpy.data.materials, bpy.data.cameras,
                 bpy.data.lights, bpy.data.actions):
        for block in list(coll):
            coll.remove(block)


def material(name, color, roughness=0.5, metallic=0.0, emission=None, strength=0.0):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = (*color, 1)
    bsdf.inputs["Roughness"].default_value = roughness
    bsdf.inputs["Metallic"].default_value = metallic
    if emission:
        key_name = "Emission Color" if "Emission Color" in bsdf.inputs else "Emission"
        bsdf.inputs[key_name].default_value = (*emission, 1)
        bsdf.inputs["Emission Strength"].default_value = strength
    return mat


def finish(obj, mat, parent=None, loc=None, rot=None, scale=None, bevel=0.0):
    obj.data.materials.append(mat)
    if bevel:
        mod = obj.modifiers.new("Bevel", "BEVEL")
        mod.width = bevel
        mod.segments = 4
    for poly in obj.data.polygons:
        poly.use_smooth = True
    if parent:
        obj.parent = parent
    if loc is not None:
        obj.location = loc
    if rot is not None:
        obj.rotation_euler = [math.radians(a) for a in rot]
    if scale is not None:
        obj.scale = scale
    return obj


def cube(name, size, mat, **kw):
    bpy.ops.mesh.primitive_cube_add(size=1)
    obj = bpy.context.active_object
    obj.name = name
    obj.scale = size
    bpy.ops.object.transform_apply(scale=True)
    return finish(obj, mat, **kw)


def sphere(name, radius, mat, **kw):
    bpy.ops.mesh.primitive_uv_sphere_add(radius=radius, segments=32, ring_count=16)
    obj = bpy.context.active_object
    obj.name = name
    return finish(obj, mat, **kw)


def cylinder(name, radius, depth, mat, **kw):
    bpy.ops.mesh.primitive_cylinder_add(radius=radius, depth=depth, vertices=24)
    obj = bpy.context.active_object
    obj.name = name
    return finish(obj, mat, **kw)


def empty(name, parent=None, loc=(0, 0, 0)):
    obj = bpy.data.objects.new(name, None)
    bpy.context.scene.collection.objects.link(obj)
    obj.empty_display_size = 0.15
    obj.parent = parent
    obj.location = loc
    return obj


OFFSET = 0   # posun všech klíčových snímků – díky němu jde řadit scény za sebe


def key(obj, path, frame, value):
    """Klíčový snímek. Úhly (rotation_euler) se zadávají ve stupních."""
    if path == "rotation_euler":
        value = [math.radians(v) for v in value]
    setattr(obj, path, value)
    obj.keyframe_insert(data_path=path, frame=frame + OFFSET)


def hold_all(frame):
    """Zamkne pózu všech animovaných objektů na daném snímku, aby další scéna
    navazovala čistým střihem a mezi scénami nic „neujíždělo“."""
    scene = bpy.context.scene
    scene.frame_set(frame)
    for obj in scene.objects:
        if obj.animation_data and obj.animation_data.action:
            for path in ("location", "rotation_euler", "scale"):
                obj.keyframe_insert(data_path=path, frame=frame)


# ---------------------------------------------------------------- model
def build_character():
    m_skin = material("Kuze", SKIN, roughness=0.6)
    m_hair = material("Vlasy", HAIR, roughness=0.45)
    m_shirt = material("Tricko", SHIRT, roughness=0.7)
    m_pants = material("Leginy", PANTS, roughness=0.6)
    m_shoes = material("Tenisky", SHOES, roughness=0.5)
    m_sole = material("Podrazka", (0.9, 0.3, 0.35), roughness=0.6)
    m_eye = material("Oci", (0.05, 0.05, 0.08), roughness=0.2)
    m_cheek = material("Tvare", (1.0, 0.5, 0.5), roughness=0.7)
    m_mouth = material("Usta", (0.75, 0.25, 0.3), roughness=0.5)

    root = empty("Postava")                      # pohyb celé postavy
    body = empty("Trup", root, (0, 0, 1.0))      # pánev – odtud roste trup

    # trup a pánev
    cube("Tricko", (0.62, 0.36, 0.62), m_shirt, parent=body, loc=(0, 0, 0.32), bevel=0.14)
    cube("Pas", (0.56, 0.34, 0.18), m_pants, parent=body, loc=(0, 0, 0.0), bevel=0.08)

    # hlava – vlastní pivot v krku
    head = empty("Hlava", body, (0, 0, 0.62))
    cylinder("Krk", 0.08, 0.16, m_skin, parent=head, loc=(0, 0, 0.05))
    sphere("Hlava_mesh", 0.3, m_skin, parent=head, loc=(0, 0, 0.36), scale=(1, 0.95, 1.05))
    eyes = []
    for side in (-1, 1):
        eye = sphere(f"Oko_{side}", 0.045, m_eye, parent=head,
                     loc=(side * 0.11, -0.27, 0.39), scale=(1, 0.6, 1.3))
        eyes.append(eye)
        sphere(f"Tvar_{side}", 0.05, m_cheek, parent=head,
               loc=(side * 0.17, -0.24, 0.29), scale=(1, 0.4, 0.7))
    cube("Usta", (0.1, 0.03, 0.025), m_mouth, parent=head, loc=(0, -0.285, 0.24), bevel=0.01)

    # vlasy: čepice, ofina a culík (culík má pivot, aby se houpal)
    sphere("Vlasy_vrch", 0.32, m_hair, parent=head, loc=(0, 0.04, 0.42), scale=(1.02, 1, 0.98))
    cube("Ofina", (0.5, 0.14, 0.12), m_hair, parent=head, loc=(0, -0.2, 0.6),
         rot=(-20, 0, 0), bevel=0.05)
    for side in (-1, 1):
        cube(f"Pramen_{side}", (0.1, 0.2, 0.32), m_hair, parent=head,
             loc=(side * 0.28, -0.02, 0.3), bevel=0.04)
    pony = empty("Culik", head, (0, 0.3, 0.55))
    sphere("Gumicka", 0.06, m_shirt, parent=pony)
    sphere("Culik_mesh", 0.13, m_hair, parent=pony, loc=(0, 0.06, -0.25), scale=(1, 1, 2.2))

    # ruce: rameno -> loket
    arms, elbows = {}, {}
    for side in (-1, 1):
        sh = empty(f"Rameno_{side}", body, (side * 0.4, 0, 0.52))
        sphere(f"Rukav_{side}", 0.12, m_shirt, parent=sh, loc=(0, 0, -0.05), scale=(1, 1, 1.3))
        cylinder(f"Paze_{side}", 0.065, 0.32, m_skin, parent=sh, loc=(0, 0, -0.2))
        el = empty(f"Loket_{side}", sh, (0, 0, -0.36))
        sphere(f"Loket_k_{side}", 0.065, m_skin, parent=el)
        cylinder(f"Predlokti_{side}", 0.06, 0.28, m_skin, parent=el, loc=(0, 0, -0.15))
        sphere(f"Dlan_{side}", 0.085, m_skin, parent=el, loc=(0, 0, -0.34), scale=(0.8, 1, 1.1))
        arms[side], elbows[side] = sh, el

    # nohy: kyčel -> koleno
    legs, knees = {}, {}
    for side in (-1, 1):
        hip = empty(f"Kycel_{side}", root, (side * 0.15, 0, 1.0))
        cylinder(f"Stehno_{side}", 0.11, 0.48, m_pants, parent=hip, loc=(0, 0, -0.24))
        kn = empty(f"Koleno_{side}", hip, (0, 0, -0.5))
        sphere(f"Koleno_k_{side}", 0.1, m_pants, parent=kn)
        cylinder(f"Lytko_{side}", 0.09, 0.38, m_pants, parent=kn, loc=(0, 0, -0.2))
        cube(f"Bota_{side}", (0.2, 0.34, 0.13), m_shoes, parent=kn,
             loc=(0, -0.06, -0.41), bevel=0.05)
        cube(f"Podrazka_{side}", (0.21, 0.35, 0.03), m_sole, parent=kn,
             loc=(0, -0.06, -0.47), bevel=0.01)
        legs[side], knees[side] = hip, kn

    return dict(root=root, body=body, head=head, eyes=eyes, pony=pony,
                arms=arms, elbows=elbows, legs=legs, knees=knees)


def build_world():
    scene = bpy.context.scene
    bpy.ops.mesh.primitive_plane_add(size=60)
    ground = bpy.context.active_object
    ground.name = "Zem"
    ground.data.materials.append(material("Trava", (0.25, 0.55, 0.25), roughness=0.9))

    m_trunk = material("Kmen", (0.35, 0.2, 0.1), roughness=0.9)
    m_leaf = material("Listi", (0.15, 0.45, 0.2), roughness=0.8)
    m_rock = material("Kamen", (0.5, 0.5, 0.52), roughness=0.9)
    for x, y, s in [(-7, 6, 1.2), (-3, 9, 1.6), (2.5, 7, 1.0),
                    (6, 5, 1.4), (9, 10, 1.8), (-10, 3, 1.1)]:
        bpy.ops.mesh.primitive_cylinder_add(radius=0.15 * s, depth=1.2 * s, location=(x, y, 0.6 * s))
        bpy.context.active_object.data.materials.append(m_trunk)
        bpy.ops.mesh.primitive_cone_add(vertices=7, radius1=1.0 * s, depth=2.5 * s,
                                        location=(x, y, 2.3 * s))
        bpy.context.active_object.data.materials.append(m_leaf)
    for x, y, s in [(-3.5, 2, 0.4), (4, 1.5, 0.3), (-1.5, 4, 0.5)]:
        bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1, radius=s, location=(x, y, s * 0.5))
        bpy.context.active_object.data.materials.append(m_rock)

    world = bpy.data.worlds.get("World") or bpy.data.worlds.new("World")
    scene.world = world
    world.use_nodes = True
    world.node_tree.nodes["Background"].inputs["Color"].default_value = (0.45, 0.65, 0.95, 1)
    world.node_tree.nodes["Background"].inputs["Strength"].default_value = 0.8

    bpy.ops.object.light_add(type="SUN", location=(5, -5, 10))
    sun = bpy.context.active_object
    sun.data.energy = 3.5
    sun.rotation_euler = (math.radians(45), math.radians(15), math.radians(35))
    bpy.ops.object.light_add(type="AREA", location=(-4, -6, 4))
    fill = bpy.context.active_object
    fill.data.energy = 300
    fill.data.size = 4
    fill.rotation_euler = (math.radians(60), 0, math.radians(-35))


def build_camera():
    target = empty("Cil_kamery", loc=(0, 0, 1.3))
    bpy.ops.object.camera_add(location=(0, -8, 2.0))
    cam = bpy.context.active_object
    cam.data.lens = 40
    con = cam.constraints.new("TRACK_TO")
    con.target = target
    con.track_axis = "TRACK_NEGATIVE_Z"
    con.up_axis = "UP_Y"
    bpy.context.scene.camera = cam
    # pomalý nájezd a lehký oblouk kolem postavy
    key(cam, "location", 1, (-1.5, -8.5, 2.1))
    key(cam, "location", 136, (0, -8, 1.9))
    key(cam, "location", 240, (1.5, -6.8, 1.8))
    key(target, "location", 1, (0, 0, 1.4))
    key(target, "location", 240, (0, 0, 1.45))
    return cam


# ---------------------------------------------------------------- animace
def pose(r, frame, arms=(0, 0, 0), arms_r=None, elbows=(0, 0, 0), elbows_r=None,
         legs=(0, 0, 0), legs_r=None, knees=(0, 0, 0), knees_r=None):
    """Nastaví pózu končetin. Hodnoty jsou pro levou stranu (side=-1);
    pravá strana se zrcadlí, pokud nedostane vlastní hodnoty (*_r)."""
    def mirror(v):
        return (v[0], -v[1], -v[2])
    for side in (-1, 1):
        a = arms if side < 0 else (arms_r if arms_r else mirror(arms))
        e = elbows if side < 0 else (elbows_r if elbows_r else mirror(elbows))
        l = legs if side < 0 else (legs_r if legs_r else mirror(legs))
        k = knees if side < 0 else (knees_r if knees_r else mirror(knees))
        key(r["arms"][side], "rotation_euler", frame, a)
        key(r["elbows"][side], "rotation_euler", frame, e)
        key(r["legs"][side], "rotation_euler", frame, l)
        key(r["knees"][side], "rotation_euler", frame, k)


def animate(r):
    root, body, head, pony = r["root"], r["body"], r["head"], r["pony"]

    # Konvence: levá ruka/noha (strana -X). Rot. Y kladná = upažení/unožení do strany,
    # rot. X záporná = předpažení. Pravá strana se zrcadlí automaticky.
    rest_arms = (0, 8, 0)
    rest_elb = (-10, 0, 0)

    # 1) klid 1–30: dýchání
    pose(r, 1, rest_arms, elbows=rest_elb)
    key(root, "location", 1, (0, 0, 0))
    key(root, "rotation_euler", 1, (0, 0, 0))
    for f, z in ((1, 1.0), (15, 1.02), (30, 1.0)):
        key(body, "location", f, (0, 0, z))
    key(head, "rotation_euler", 1, (0, 0, 0))
    key(pony, "rotation_euler", 1, (0, 0, 0))
    pose(r, 30, rest_arms, elbows=rest_elb)

    # 2) protažení 30–80: obě ruce nad hlavu, na špičky
    pose(r, 48, (-175, 5, 0), elbows=(0, 0, 0))
    key(root, "location", 30, (0, 0, 0))
    key(root, "location", 50, (0, 0, 0.08))
    key(root, "location", 66, (0, 0, 0.08))
    key(head, "rotation_euler", 48, (-15, 0, 0))     # pohled nahoru
    pose(r, 66, (-175, 5, 0), elbows=(0, 0, 0))
    pose(r, 80, rest_arms, elbows=rest_elb)
    key(root, "location", 78, (0, 0, 0))
    key(head, "rotation_euler", 78, (0, 0, 0))

    # 3) panák 84–132: 2× skok – ruce nahoru, nohy od sebe
    for a in (84, 108):
        pose(r, a, rest_arms, elbows=rest_elb)
        key(root, "location", a, (0, 0, 0))
        key(root, "location", a + 6, (0, 0, 0.3))
        pose(r, a + 12, (0, 165, 0), elbows=(0, 0, 0), legs=(0, 18, 0))
        key(root, "location", a + 12, (0, 0, 0))
        key(root, "location", a + 18, (0, 0, 0.3))
        key(pony, "rotation_euler", a + 6, (-25, 0, 0))
        key(pony, "rotation_euler", a + 12, (15, 0, 0))
        key(pony, "rotation_euler", a + 18, (-25, 0, 0))
        key(pony, "rotation_euler", a + 24, (10, 0, 0))
    pose(r, 132, rest_arms, elbows=rest_elb)
    key(root, "location", 132, (0, 0, 0))
    key(pony, "rotation_euler", 140, (0, 0, 0))

    # 4) otočka 136–184 s rozpaženýma rukama
    key(root, "rotation_euler", 136, (0, 0, 0))
    pose(r, 146, (0, 80, 0), elbows=(0, 0, 0))
    key(root, "rotation_euler", 178, (0, 0, 360))
    pose(r, 172, (0, 80, 0), elbows=(0, 0, 0))
    key(pony, "rotation_euler", 150, (0, 40, 0))      # culík vlaje odstředivou silou
    key(pony, "rotation_euler", 172, (0, 40, 0))
    key(pony, "rotation_euler", 186, (0, 0, 0))
    pose(r, 186, rest_arms, elbows=rest_elb)

    # 5) rozkročení a mávání pravou rukou 186–220
    wave = r["arms"][1]
    wave_el = r["elbows"][1]
    pose(r, 196, rest_arms, elbows=rest_elb, legs=(0, 12, 0),
         arms_r=(0, -150, 0), elbows_r=(0, -20, 0))
    for i, f in enumerate(range(200, 218, 4)):
        key(wave_el, "rotation_euler", f, (0, -40 if i % 2 else 5, 0))
    key(body, "rotation_euler", 186, (0, 0, 0))
    key(body, "rotation_euler", 200, (0, 6, 0))       # lehký náklon do strany
    key(head, "rotation_euler", 200, (0, -10, 0))
    key(wave, "rotation_euler", 216, (0, -150, 0))
    key(body, "rotation_euler", 216, (0, 6, 0))

    # 6) zpět do klidu a naklonění hlavy 220–240
    pose(r, 228, rest_arms, elbows=rest_elb)
    key(body, "rotation_euler", 228, (0, 0, 0))
    key(head, "rotation_euler", 232, (0, 12, 0))
    key(head, "rotation_euler", 240, (0, 10, 0))

    # mrkání
    for eye in r["eyes"]:
        for f in (20, 95, 160, 236):
            key(eye, "scale", f - 2, (1, 0.6, 1.3))
            key(eye, "scale", f, (1, 0.6, 0.1))
            key(eye, "scale", f + 3, (1, 0.6, 1.3))


# ---------------------------------------------------------------- scéna "pozy"
def build_camera_pozy():
    """Kamera zepředu, při dřepu vyjede nahoru a dívá se shora."""
    target = empty("Cil_kamery", loc=(0, 0, 1.5))
    bpy.ops.object.camera_add(location=(0, -7.5, 1.8))
    cam = bpy.context.active_object
    cam.data.lens = 40
    con = cam.constraints.new("TRACK_TO")
    con.target = target
    con.track_axis = "TRACK_NEGATIVE_Z"
    con.up_axis = "UP_Y"
    bpy.context.scene.camera = cam

    key(cam, "location", 1, (0, -8, 1.7))
    key(cam, "location", 60, (-0.6, -7.4, 1.8))
    key(cam, "location", 140, (0.6, -7.2, 1.8))
    key(cam, "location", 158, (0.4, -6.5, 2.4))
    key(cam, "location", 182, (0, -2.6, 5.6))       # záběr shora na dřep
    key(cam, "location", 212, (0, -2.4, 5.4))
    key(cam, "location", 240, (0, -7.2, 1.9))
    key(target, "location", 1, (0, 0, 1.5))
    key(target, "location", 140, (0, 0, 1.55))
    key(target, "location", 182, (0, 0.3, 0.6))
    key(target, "location", 212, (0, 0.3, 0.6))
    key(target, "location", 240, (0, 0, 1.4))
    return cam


def animate_pozy(r):
    root, body, head, pony = r["root"], r["body"], r["head"], r["pony"]
    rest_arms = (0, 8, 0)
    rest_elb = (-10, 0, 0)
    up = (-178, -6, 0)           # ruce vztyčené nad hlavu (lehce od sebe)
    v_arms = (0, 140, 0)         # ruce do „V“
    hold = dict(elbows=(0, 0, 0))

    # 1) klid 1–20
    pose(r, 1, rest_arms, elbows=rest_elb)
    pose(r, 20, rest_arms, elbows=rest_elb)
    key(root, "location", 1, (0, 0, 0))
    key(root, "rotation_euler", 1, (0, 0, 0))
    key(body, "rotation_euler", 1, (0, 0, 0))
    key(head, "rotation_euler", 1, (0, 0, 0))
    key(pony, "rotation_euler", 1, (0, 0, 0))
    for f, z in ((1, 1.0), (12, 1.02), (24, 1.0)):
        key(body, "location", f, (0, 0, z))

    # 2) ruce nad hlavu a pohled vzhůru 20–60
    pose(r, 40, up, **hold)
    key(head, "rotation_euler", 26, (0, 0, 0))
    key(head, "rotation_euler", 44, (-22, 0, 0))
    pose(r, 60, up, **hold)
    key(head, "rotation_euler", 60, (-18, 0, 0))

    # 3) pomalá otočka bokem (84) a zády (110), váha na jedné noze
    key(root, "rotation_euler", 60, (0, 0, 0))
    key(root, "rotation_euler", 84, (0, 0, 90))
    key(root, "rotation_euler", 96, (0, 0, 90))
    key(root, "rotation_euler", 112, (0, 0, 180))
    pose(r, 84, up, **hold, legs=(-8, 2, 0), knees=(15, 0, 0),
         legs_r=(0, -2, 0), knees_r=(0, 0, 0))
    key(body, "rotation_euler", 84, (0, -3, 0))        # lehké prohnutí v boku
    key(head, "rotation_euler", 84, (-10, 0, 0))
    pose(r, 112, up, **hold)
    key(body, "rotation_euler", 112, (0, 0, 0))
    key(head, "rotation_euler", 112, (-5, 0, 0))

    # 4) zády ke kameře – ruce do V 112–140
    pose(r, 126, v_arms, **hold)
    key(head, "rotation_euler", 126, (-5, 0, 20))      # ohlédnutí přes rameno
    pose(r, 140, v_arms, **hold)
    key(head, "rotation_euler", 140, (-5, 0, 15))

    # 5) otočení zpět čelem 140–160 a dřep s rukama nahoře 160–212
    key(root, "rotation_euler", 140, (0, 0, 180))
    key(root, "rotation_euler", 160, (0, 0, 360))
    key(head, "rotation_euler", 158, (0, 0, 0))
    pose(r, 160, v_arms, **hold)
    key(root, "location", 160, (0, 0, 0))
    key(body, "rotation_euler", 160, (0, 0, 0))
    # stehna vodorovně (-90°), kolena ven, bérce svisle -> chodidla zůstanou na zemi
    squat = dict(legs=(-88, 0, -14), knees=(92, 0, 0))
    pose(r, 180, (-150, -30, 0), elbows=(-35, 0, 0), **squat)
    key(root, "location", 180, (0, 0.46, -0.5))         # pánev dolů a dozadu
    key(body, "rotation_euler", 180, (-22, 0, 0))       # předklon trupu
    key(head, "rotation_euler", 180, (-35, 0, 0))       # pohled nahoru do kamery
    key(pony, "rotation_euler", 176, (-30, 0, 0))
    key(pony, "rotation_euler", 186, (10, 0, 0))
    key(pony, "rotation_euler", 194, (0, 0, 0))
    pose(r, 210, (-150, -30, 0), elbows=(-35, 0, 0), **squat)
    key(root, "location", 210, (0, 0.46, -0.5))
    key(body, "rotation_euler", 210, (-22, 0, 0))
    key(head, "rotation_euler", 210, (-35, 0, 0))

    # 6) zvednutí a návrat do klidu 210–240
    pose(r, 228, rest_arms, elbows=rest_elb)
    key(root, "location", 228, (0, 0, 0))
    key(body, "rotation_euler", 226, (0, 0, 0))
    key(head, "rotation_euler", 230, (0, 8, 0))
    pose(r, 240, rest_arms, elbows=rest_elb)

    for eye in r["eyes"]:
        for f in (16, 100, 150, 236):
            key(eye, "scale", f - 2, (1, 0.6, 1.3))
            key(eye, "scale", f, (1, 0.6, 0.1))
            key(eye, "scale", f + 3, (1, 0.6, 1.3))


# ---------------------------------------------------------------- render
def setup_render():
    scene = bpy.context.scene
    scene.render.fps = FPS
    scene.frame_start = 1
    scene.frame_end = END * 2 if SCENA == "film" else END
    for engine in ("BLENDER_EEVEE_NEXT", "BLENDER_EEVEE"):
        try:
            scene.render.engine = engine
            break
        except TypeError:
            continue
    scene.render.resolution_x = 1920
    scene.render.resolution_y = 1080
    scene.render.resolution_percentage = 40 if PREVIEW else 100
    if hasattr(scene.eevee, "taa_render_samples"):
        scene.eevee.taa_render_samples = 16 if PREVIEW else 64
    try:
        scene.view_settings.view_transform = "AgX"
    except TypeError:
        scene.view_settings.view_transform = "Filmic"
    try:
        scene.view_settings.look = "AgX - Punchy"
    except TypeError:
        pass

    os.makedirs(OUT_DIR, exist_ok=True)
    img = scene.render.image_settings
    if hasattr(img, "media_type"):          # Blender 5.x
        img.media_type = "VIDEO"
    img.file_format = "FFMPEG"
    scene.render.ffmpeg.format = "MPEG4"
    scene.render.ffmpeg.codec = "H264"
    scene.render.ffmpeg.constant_rate_factor = "HIGH"
    scene.render.filepath = os.path.join(OUT_DIR, "ela.mp4")


def main():
    clear_scene()
    character = build_character()
    build_world()
    global OFFSET
    if SCENA == "film":
        scene = bpy.context.scene
        OFFSET = 0
        cam1 = build_camera()
        animate(character)                   # 1–240: rozcvička
        hold_all(END)
        OFFSET = END
        cam2 = build_camera_pozy()
        animate_pozy(character)              # 241–480: pózy
        OFFSET = 0
        # střih: každá kamera má svůj úsek časové osy
        scene.timeline_markers.new("Rozcvicka", frame=1).camera = cam1
        scene.timeline_markers.new("Pozy", frame=END + 1).camera = cam2
        scene.camera = cam1
    elif SCENA == "pozy":
        build_camera_pozy()
        animate_pozy(character)
    else:
        build_camera()
        animate(character)
    setup_render()
    bpy.context.scene.frame_set(1)

    if DO_GLB:
        os.makedirs(OUT_DIR, exist_ok=True)
        bpy.ops.export_scene.gltf(filepath=os.path.join(OUT_DIR, "ela.glb"),
                                  export_format="GLB", export_animations=True)
    if DO_RENDER:
        bpy.ops.render.render(animation=True)
        print("Hotovo:", bpy.context.scene.render.filepath)


main()
