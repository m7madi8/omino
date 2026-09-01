"""Extrude the OMINO SVG mark into a GLB."""
from pathlib import Path

import numpy as np
import trimesh
from shapely.geometry import Polygon
from shapely.validation import make_valid
from svgpathtools import parse_path

OUTER = (
    "M 999.452 583.377 C 1002.55 582.864 1011.79 582.534 1015.45 582.52 "
    "C 1124.57 582.099 1238.99 628.369 1317.19 703.496 C 1404.53 787.545 "
    "1455.19 902.654 1458.17 1023.83 C 1459.59 1107.13 1419.3 1182.53 "
    "1345.73 1222.97 C 1309.27 1243.01 1279.13 1246.95 1238.7 1247.38 "
    "C 1238.42 1265.6 1237.68 1283.5 1233.94 1301.39 C 1214.83 1392.95 "
    "1141.63 1453.75 1050.25 1464.47 C 1047.01 1465.05 1037.72 1465.39 "
    "1033.89 1465.44 C 950.752 1466.53 864.349 1439.48 795.274 1393.52 "
    "C 772.236 1378.19 747.765 1357.32 728.1 1338.27 C 641.587 1254.46 "
    "594.019 1140.41 592.025 1020.18 C 591.024 959.834 610.557 907.971 "
    "652.127 864.289 C 695.119 819.111 748.835 802.174 809.971 800.894 "
    "C 808.405 683.74 882.351 597.052 999.452 583.377 z"
)
INNER = (
    "M 810.758 800.525 C 836.938 798.78 871.66 800.025 898.336 799.863 "
    "C 938.965 800.75 979.686 798.785 1020.3 799.771 C 1138.95 802.654 "
    "1237.7 897.607 1237.85 1017.49 C 1237.94 1095.14 1239.45 1171.02 "
    "1237.99 1247.5 L 1031.78 1247.12 C 968.782 1246.94 918.661 1225.44 "
    "873.509 1181.59 C 804.097 1114.17 810.901 1033.82 810.516 946.11 "
    "L 810.758 800.525 z"
)


def path_to_coords(d, samples=32):
    path = parse_path(d)
    pts = []
    for seg in path:
        ts = np.linspace(0.0, 1.0, samples, endpoint=False)
        for t in ts:
            p = seg.point(t)
            pts.append((float(p.real), float(-p.imag)))
    coords = np.array(pts, dtype=np.float64)
    if not np.allclose(coords[0], coords[-1]):
        coords = np.vstack([coords, coords[0]])
    return coords


def to_polygon(d):
    poly = Polygon(path_to_coords(d))
    if not poly.is_valid:
        poly = make_valid(poly)
    if poly.geom_type == "MultiPolygon":
        poly = max(poly.geoms, key=lambda g: g.area)
    if poly.exterior.is_ccw:
        poly = Polygon(list(poly.exterior.coords)[::-1])
    return poly


def main():
    outer = to_polygon(OUTER)
    inner = to_polygon(INNER)
    shape = outer.difference(inner)
    if shape.geom_type == "MultiPolygon":
        shape = max(shape.geoms, key=lambda g: g.area)
    shape = make_valid(shape)
    if shape.is_empty:
        raise SystemExit("Boolean difference produced an empty shape.")

    # Thickness ~ 14% of the mark's width — a sculptural disc, not a slab.
    height = float(shape.bounds[2] - shape.bounds[0]) * 0.14
    mesh = trimesh.creation.extrude_polygon(shape, height=height)
    mesh.apply_translation(-mesh.centroid)
    scale = 1.0 / max(mesh.extents)
    mesh.apply_scale(scale)

    mesh.visual.vertex_colors = [244, 245, 246, 255]
    try:
        mesh.visual = trimesh.visual.TextureVisuals()
    except Exception:
        pass
    pbr = trimesh.visual.material.PBRMaterial(
        name="OminoSatin",
        baseColorFactor=[0.957, 0.961, 0.965, 1.0],
        metallicFactor=0.05,
        roughnessFactor=0.42,
    )
    mesh.visual = trimesh.visual.TextureVisuals(material=pbr)

    out = Path(__file__).resolve().parent / "omino.glb"
    mesh.export(out)
    print(f"Wrote {out}")
    print(f"verts={len(mesh.vertices)} faces={len(mesh.faces)} extents={mesh.extents}")


if __name__ == "__main__":
    main()
