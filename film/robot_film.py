"""
Robot "Bzuk" – 3D model + animace pro krátký film (Blender 4.x / 5.x).

Použití:
  GUI:     Blender -> záložka Scripting -> Open -> robot_film.py -> Run Script
  Render:  blender -b -P robot_film.py -- --render          (uloží film/render/bzuk.mp4)
  Export:  blender -b -P robot_film.py -- --glb             (uloží film/render/bzuk.glb)
  Náhled:  blender -b -P robot_film.py -- --render --preview (menší rozlišení, rychlé)

Děj (10 s, 24 fps):
  0–4 s   robot přichází zleva, chodí
  4–5 s   zastaví se a otočí ke kameře
  5–7 s   mává
  7–8.5 s přikrčí se a vyskočí
  8.5–10 s dopadne, zatočí se radostí a zabliká anténou
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


# ---------------------------------------------------------------- pomocníci
def clear_scene():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete()
    for coll in (bpy.data.meshes, bpy.data.materials, bpy.data.cameras,
                 bpy.data.lights, bpy.data.actions):
        for block in list(coll):
            coll.remove(block)


def material(name, color, roughness=0.4, metallic=0.0, emission=None, strength=0.0):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = (*color, 1)
    bsdf.inputs["Roughness"].default_value = roughness
    bsdf.inputs["Metallic"].default_value = metallic
    if emission:
        key = "Emission Color" if "Emission Color" in bsdf.inputs else "Emission"
        bsdf.inputs[key].default_value = (*emission, 1)
        bsdf.inputs["Emission Strength"].default_value = strength
    return mat


def finish(obj, mat, parent=None, loc=None, bevel=0.0, smooth=True):
    obj.data.materials.append(mat)
    if bevel:
        mod = obj.modifiers.new("Bevel", "BEVEL")
        mod.width = bevel
        mod.segments = 4
    if smooth:
        for poly in obj.data.polygons:
            poly.use_smooth = True
    if parent:
        obj.parent = parent
    if loc is not None:
        obj.location = loc
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
    obj.empty_display_size = 0.2
    obj.parent = parent
    obj.location = loc
    return obj


def key(obj, path, frame, value, index=-1):
    """Vloží klíčový snímek. Úhly v rotation_euler se zadávají ve stupních."""
    if path == "rotation_euler":
        value = [math.radians(v) for v in value] if index == -1 else math.radians(value)
    if index == -1:
        setattr(obj, path, value)
    else:
        getattr(obj, path)[index] = value
    obj.keyframe_insert(data_path=path, frame=frame, index=index)


# ---------------------------------------------------------------- model
def build_robot():
    m_body = material("Telo", (0.95, 0.45, 0.10), roughness=0.35, metallic=0.2)
    m_dark = material("Kovova", (0.12, 0.13, 0.16), roughness=0.3, metallic=0.9)
    m_light = material("Svetla", (0.92, 0.92, 0.88), roughness=0.5)
    m_eye = material("Oci", (0.0, 0.0, 0.0), emission=(0.3, 0.9, 1.0), strength=6)
    m_bulb = material("Antena", (1.0, 0.2, 0.2), emission=(1.0, 0.15, 0.1), strength=3)

    root = empty("Robot")                       # celý robot (pohyb po scéně)
    body = empty("Trup", root, (0, 0, 1.25))    # trup (pohupování, squash)

    cube("Trup_mesh", (1.1, 0.8, 1.0), m_body, parent=body, bevel=0.12)
    cube("Panel", (0.6, 0.05, 0.45), m_light, parent=body, loc=(0, -0.41, 0.05), bevel=0.04)
    for i, col in enumerate([(1, 0.2, 0.2), (1, 0.85, 0.1), (0.2, 1, 0.3)]):
        sphere(f"Tlacitko{i}", 0.06, material(f"LED{i}", col, emission=col, strength=2),
               parent=body, loc=(-0.15 + i * 0.15, -0.44, 0.12))

    # hlava – samostatný pivot, aby se mohla otáčet
    head = empty("Hlava", body, (0, 0, 0.6))
    cylinder("Krk", 0.12, 0.25, m_dark, parent=head, loc=(0, 0, 0.05))
    cube("Hlava_mesh", (0.85, 0.7, 0.6), m_body, parent=head, loc=(0, 0, 0.45), bevel=0.15)
    cube("Obrazovka", (0.65, 0.05, 0.38), m_dark, parent=head, loc=(0, -0.35, 0.45), bevel=0.05)
    eyes = []
    for side in (-1, 1):
        eye = sphere(f"Oko_{'L' if side < 0 else 'P'}", 0.09, m_eye,
                     parent=head, loc=(side * 0.16, -0.38, 0.48))
        eye.scale = (1, 0.5, 1.2)
        eyes.append(eye)
        cylinder(f"Ucho_{side}", 0.1, 0.12, m_dark, parent=head,
                 loc=(side * 0.46, 0, 0.45)).rotation_euler = (0, math.radians(90), 0)
    cylinder("Antena_tyc", 0.025, 0.35, m_dark, parent=head, loc=(0, 0, 0.9))
    bulb = sphere("Antena_kulicka", 0.08, m_bulb, parent=head, loc=(0, 0, 1.1))

    # ruce – pivot v rameni, ruka visí dolů
    arms = {}
    for side in (-1, 1):
        pivot = empty(f"Rameno_{side}", body, (side * 0.65, 0, 0.3))
        sphere(f"Kloub_r_{side}", 0.13, m_dark, parent=pivot)
        cylinder(f"Paze_{side}", 0.08, 0.55, m_light, parent=pivot, loc=(0, 0, -0.33))
        sphere(f"Dlan_{side}", 0.12, m_body, parent=pivot, loc=(0, 0, -0.65))
        arms[side] = pivot

    # nohy – pivot v kyčli
    legs = {}
    for side in (-1, 1):
        pivot = empty(f"Kycel_{side}", root, (side * 0.3, 0, 0.8))
        cylinder(f"Noha_{side}", 0.1, 0.55, m_dark, parent=pivot, loc=(0, 0, -0.3))
        cube(f"Bota_{side}", (0.3, 0.42, 0.18), m_body, parent=pivot,
             loc=(0, -0.06, -0.66), bevel=0.06)
        legs[side] = pivot

    return dict(root=root, body=body, head=head, eyes=eyes, bulb=bulb,
                bulb_mat=m_bulb, arms=arms, legs=legs)


def build_world():
    scene = bpy.context.scene
    bpy.ops.mesh.primitive_plane_add(size=60)
    ground = bpy.context.active_object
    ground.name = "Zem"
    ground.data.materials.append(material("Trava", (0.25, 0.55, 0.25), roughness=0.9))

    # pár low-poly stromů a kamenů v pozadí
    m_trunk = material("Kmen", (0.35, 0.2, 0.1), roughness=0.9)
    m_leaf = material("Listi", (0.15, 0.45, 0.2), roughness=0.8)
    m_rock = material("Kamen", (0.5, 0.5, 0.52), roughness=0.9)
    for i, (x, y, s) in enumerate([(-7, 6, 1.2), (-3, 9, 1.6), (2, 7, 1.0),
                                   (6, 5, 1.4), (9, 10, 1.8), (-10, 3, 1.1)]):
        bpy.ops.mesh.primitive_cylinder_add(radius=0.15 * s, depth=1.2 * s, location=(x, y, 0.6 * s))
        bpy.context.active_object.data.materials.append(m_trunk)
        bpy.ops.mesh.primitive_cone_add(vertices=7, radius1=1.0 * s, depth=2.5 * s,
                                        location=(x, y, 2.3 * s))
        bpy.context.active_object.data.materials.append(m_leaf)
    for x, y, s in [(-4, 2, 0.4), (4.5, 1.5, 0.3), (-1.5, 4, 0.5)]:
        bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1, radius=s, location=(x, y, s * 0.5))
        bpy.context.active_object.data.materials.append(m_rock)

    # nebe
    world = bpy.data.worlds.get("World") or bpy.data.worlds.new("World")
    scene.world = world
    world.use_nodes = True
    world.node_tree.nodes["Background"].inputs["Color"].default_value = (0.45, 0.65, 0.95, 1)
    world.node_tree.nodes["Background"].inputs["Strength"].default_value = 0.8

    # světla
    bpy.ops.object.light_add(type="SUN", location=(5, -5, 10))
    sun = bpy.context.active_object
    sun.data.energy = 3.5
    sun.rotation_euler = (math.radians(45), math.radians(15), math.radians(35))
    bpy.ops.object.light_add(type="AREA", location=(-4, -6, 4))
    fill = bpy.context.active_object
    fill.data.energy = 300
    fill.data.size = 4
    fill.rotation_euler = (math.radians(60), 0, math.radians(-35))


def build_camera(robot_root):
    target = empty("Cil_kamery", loc=(0, 0, 1.4))
    bpy.ops.object.camera_add(location=(0, -10, 3))
    cam = bpy.context.active_object
    cam.data.lens = 40
    con = cam.constraints.new("TRACK_TO")
    con.target = target
    con.track_axis = "TRACK_NEGATIVE_Z"
    con.up_axis = "UP_Y"
    bpy.context.scene.camera = cam

    # kamera sleduje příchod a pak pomalu najíždí
    key(target, "location", 1, (-4, 0, 1.4))
    key(target, "location", 96, (0, 0, 1.6))
    key(target, "location", 240, (0, 0, 1.8))
    key(cam, "location", 1, (-2, -11, 3.2))
    key(cam, "location", 120, (0, -9, 2.6))
    key(cam, "location", 240, (1.2, -7, 2.2))
    return cam


# ---------------------------------------------------------------- animace
def animate(r):
    root, body, head = r["root"], r["body"], r["head"]
    arms, legs = r["arms"], r["legs"]

    # 1) chůze 1–96: přesun zleva doprostřed, otočený bokem (čelem k +X)
    key(root, "location", 1, (-6, 0, 0))
    key(root, "location", 96, (0, 0, 0))
    key(root, "rotation_euler", 1, (0, 0, 90))
    key(root, "rotation_euler", 90, (0, 0, 90))
    step = 12  # půl kroku = 12 snímků
    for f in range(1, 97, step):
        phase = 1 if (f // step) % 2 == 0 else -1
        for side in (-1, 1):
            key(legs[side], "rotation_euler", f, (25 * phase * side, 0, 0))
            key(arms[side], "rotation_euler", f, (-30 * phase * side, 0, 0))
        key(body, "location", f, (0, 0, 1.25))
        key(body, "location", f + step // 2, (0, 0, 1.33))   # pohupování
        key(head, "rotation_euler", f, (0, 0, 4 * phase))

    # 2) zastavení a otočení ke kameře 96–120
    for side in (-1, 1):
        key(legs[side], "rotation_euler", 104, (0, 0, 0))
        key(arms[side], "rotation_euler", 104, (0, 0, 0))
    key(root, "rotation_euler", 110, (0, 0, 0))
    key(body, "location", 104, (0, 0, 1.25))
    key(head, "rotation_euler", 100, (0, 0, 0))
    key(head, "rotation_euler", 112, (8, 0, -25))      # zvědavý pohled
    key(head, "rotation_euler", 122, (-5, 10, 0))      # naklonění hlavy

    # 3) mávání 120–168 (pravá ruka na straně +X)
    wave = arms[1]
    key(wave, "rotation_euler", 120, (0, 0, 0))
    key(wave, "rotation_euler", 130, (0, -150, 0))
    for i, f in enumerate(range(134, 162, 7)):
        key(wave, "rotation_euler", f, (0, -130 if i % 2 else -170, 0))
    key(wave, "rotation_euler", 162, (0, -150, 0))
    key(wave, "rotation_euler", 172, (0, 0, 0))
    key(head, "rotation_euler", 140, (-5, -8, 0))
    key(head, "rotation_euler", 165, (0, 0, 0))

    # 4) přikrčení a skok 168–204
    key(root, "location", 172, (0, 0, 0))
    key(root, "scale", 172, (1, 1, 1))
    key(root, "scale", 182, (1.12, 1.12, 0.8))         # squash
    key(root, "location", 182, (0, 0, 0))
    key(root, "scale", 188, (0.9, 0.9, 1.15))          # stretch
    key(root, "location", 196, (0, 0, 1.8))            # vrchol skoku
    key(root, "scale", 196, (1, 1, 1))
    for side in (-1, 1):
        key(arms[side], "rotation_euler", 182, (40, 0, 0))
        key(arms[side], "rotation_euler", 192, (0, side * -160, 0))   # ruce nahoru
        key(legs[side], "rotation_euler", 182, (0, 0, 0))
        key(legs[side], "rotation_euler", 196, (-20, 0, 0))
    key(root, "location", 206, (0, 0, 0))              # dopad
    key(root, "scale", 206, (1, 1, 1))
    key(root, "scale", 210, (1.1, 1.1, 0.85))
    key(root, "scale", 216, (1, 1, 1))
    for side in (-1, 1):
        key(legs[side], "rotation_euler", 206, (0, 0, 0))
        key(arms[side], "rotation_euler", 216, (0, side * -40, 0))

    # 5) radostná otočka 216–240
    key(root, "rotation_euler", 216, (0, 0, 0))
    key(root, "rotation_euler", 238, (0, 0, 360))
    for side in (-1, 1):
        key(arms[side], "rotation_euler", 240, (0, side * -60, 0))

    # mrkání očí
    for eye in r["eyes"]:
        for f in (1, 60, 150, 220):
            key(eye, "scale", f - 2, (1, 0.5, 1.2))
            key(eye, "scale", f, (1, 0.5, 0.1))
            key(eye, "scale", f + 3, (1, 0.5, 1.2))

    # blikání antény (síla emise)
    bsdf = r["bulb_mat"].node_tree.nodes["Principled BSDF"]
    strength = bsdf.inputs["Emission Strength"]
    for f in range(1, END + 1, 12):
        strength.default_value = 8 if (f // 12) % 2 == 0 else 1
        if f > 200:
            strength.default_value = 20 if (f // 6) % 2 == 0 else 2
        strength.keyframe_insert("default_value", frame=f)


# ---------------------------------------------------------------- render
def setup_render():
    scene = bpy.context.scene
    scene.render.fps = FPS
    scene.frame_start = 1
    scene.frame_end = END
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

    os.makedirs(OUT_DIR, exist_ok=True)
    img = scene.render.image_settings
    if hasattr(img, "media_type"):          # Blender 5.x
        img.media_type = "VIDEO"
    img.file_format = "FFMPEG"
    scene.render.ffmpeg.format = "MPEG4"
    scene.render.ffmpeg.codec = "H264"
    scene.render.ffmpeg.constant_rate_factor = "HIGH"
    scene.render.filepath = os.path.join(OUT_DIR, "bzuk.mp4")


def main():
    clear_scene()
    robot = build_robot()
    build_world()
    build_camera(robot["root"])
    animate(robot)
    setup_render()
    bpy.context.scene.frame_set(1)

    if DO_GLB:
        os.makedirs(OUT_DIR, exist_ok=True)
        bpy.ops.export_scene.gltf(filepath=os.path.join(OUT_DIR, "bzuk.glb"),
                                  export_format="GLB", export_animations=True)
    if DO_RENDER:
        bpy.ops.render.render(animation=True)
        print("Hotovo:", bpy.context.scene.render.filepath)


main()
