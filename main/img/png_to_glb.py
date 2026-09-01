"""Trace both OMINO mark silhouettes from PNG into a beveled GLB."""
from pathlib import Path

import cv2
import numpy as np
import trimesh
from shapely.geometry import Polygon
from shapely.validation import make_valid
from trimesh.visual.material import PBRMaterial
from trimesh.visual.texture import TextureVisuals

SRC = Path(__file__).resolve().parent / "img" / "1000245263-removebg-preview.png"
OUT = Path(__file__).resolve().parent / "omino-mark.glb"


def chaikin(pts: np.ndarray, iterations: int = 4) -> np.ndarray:
    if np.allclose(pts[0], pts[-1]):
        pts = pts[:-1]
    for _ in range(iterations):
        nxt = []
        n = len(pts)
        for i in range(n):
            p, q = pts[i], pts[(i + 1) % n]
            nxt.append(0.75 * p + 0.25 * q)
            nxt.append(0.25 * p + 0.75 * q)
        pts = np.asarray(nxt)
    return np.vstack([pts, pts[0]])


def load_binary(path: Path, scale: int = 5) -> np.ndarray:
    img = cv2.imread(str(path), cv2.IMREAD_UNCHANGED)
    if img is None:
        raise SystemExit(f"Could not read {path}")
    alpha = img[:, :, 3] if img.shape[2] == 4 else cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    ys, xs = np.where(alpha > 16)
    pad = 20
    crop = alpha[
        max(0, ys.min() - pad) : min(alpha.shape[0], ys.max() + pad + 1),
        max(0, xs.min() - pad) : min(alpha.shape[1], xs.max() + pad + 1),
    ]
    h, w = crop.shape
    crop = cv2.resize(crop, (w * scale, h * scale), interpolation=cv2.INTER_CUBIC)
    crop = cv2.GaussianBlur(crop, (0, 0), 0.8)
    _, binary = cv2.threshold(crop, 80, 255, cv2.THRESH_BINARY)
    return binary


def contours_to_polygons(binary: np.ndarray) -> list[Polygon]:
    contours, _ = cv2.findContours(binary, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
    polys = []
    for cnt in contours:
        pts = cnt.reshape(-1, 2).astype(np.float64)
        if len(pts) < 12:
            continue
        pts = chaikin(pts, iterations=2)
        ring = [(p[0], -p[1]) for p in pts]
        poly = make_valid(Polygon(ring))
        if poly.geom_type == "MultiPolygon":
            poly = max(poly.geoms, key=lambda g: g.area)
        if poly.area > 80:
            polys.append(poly)
    if not polys:
        raise SystemExit("No silhouettes found.")
    return sorted(polys, key=lambda g: g.area, reverse=True)


def rounded_extrude(poly: Polygon, height: float, radius: float) -> trimesh.Trimesh:
    inset = poly.buffer(-radius, join_style=1, mitre_limit=2)
    if inset.is_empty or inset.area < poly.area * 0.25:
        return trimesh.creation.extrude_polygon(poly, height=height)
    if inset.geom_type == "MultiPolygon":
        inset = max(inset.geoms, key=lambda g: g.area)
    core = trimesh.creation.extrude_polygon(inset, height=height)
    slab = trimesh.creation.extrude_polygon(poly, height=max(height - 2 * radius, height * 0.5))
    slab.apply_translation([0.0, 0.0, radius])
    try:
        mesh = core.union(slab, engine="auto")
        if isinstance(mesh, trimesh.Scene):
            mesh = trimesh.util.concatenate(tuple(mesh.geometry.values()))
    except Exception:
        mesh = trimesh.util.concatenate([core, slab])
    return mesh


def main():
    binary = load_binary(SRC, scale=3)
    polys = contours_to_polygons(binary)
    span = max(max(p.bounds[2] - p.bounds[0], p.bounds[3] - p.bounds[1]) for p in polys)
    height = span * 0.28
    radius = span * 0.055
    parts = [rounded_extrude(p, height=height, radius=radius) for p in polys]
    mesh = trimesh.util.concatenate(parts)
    mesh.update_faces(mesh.unique_faces())
    mesh.remove_unreferenced_vertices()
    trimesh.smoothing.filter_taubin(mesh, lamb=0.4, nu=-0.4, iterations=4)

    mesh.apply_translation(-mesh.centroid)
    mesh.apply_scale(1.0 / max(mesh.extents))

    mesh.visual = TextureVisuals(
        material=PBRMaterial(
            name="OminoCeramic",
            baseColorFactor=[0.97, 0.97, 0.975, 1.0],
            metallicFactor=0.03,
            roughnessFactor=0.34,
        )
    )
    mesh.export(OUT)
    print(f"Wrote {OUT}")
    print(f"parts={len(polys)} verts={len(mesh.vertices)} faces={len(mesh.faces)} extents={np.round(mesh.extents, 4)}")


if __name__ == "__main__":
    main()
