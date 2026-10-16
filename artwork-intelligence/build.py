#!/usr/bin/env python3
"""Deterministic build of the self-contained, extension-installable userscript."""
from pathlib import Path
import json
ROOT=Path(__file__).resolve().parents[1]
CORE=(ROOT/'artwork-intelligence/src/core.js').read_text()
GEOMETRY=(ROOT/'artwork-intelligence/src/geometry.js').read_text()
PNG=(ROOT/'artwork-intelligence/src/png.js').read_text()
SERVICE=(ROOT/'artwork-intelligence/src/service.js').read_text()
WORKER=CORE+'\n'+GEOMETRY+'''\nself.onmessage=e=>{const {id,rgba,width,height,format}=e.data;try{const colorAt=performance.now();const colors=artColors(new Uint8Array(rgba),width,height,format);const colorMs=performance.now()-colorAt;const geomAt=performance.now();const geometry=artGeometry(new Uint8Array(rgba),width,height);const geometryMs=performance.now()-geomAt;self.postMessage({id,ok:true,colors,geometry,colorMs,geometryMs},geometry.packedMask?[geometry.packedMask.buffer]:[]);}catch(error){self.postMessage({id,ok:false,error:String(error?.message||error)});}};\n'''
HEADER='''// ==UserScript==
// @name         Artwork Intelligence [v0.1.0]
// @namespace    https://poke5e.app/yofi/artwork-intelligence
// @version      0.1.0
// @description  Independent normal Fakemon artwork analysis, exact silhouettes, persistent metadata and diagnostics.
// @match        https://poke5e.app/*
// @match        https://www.poke5e.app/*
// @run-at       document-idle
// @grant        none
// ==/UserScript==
'''
SCRIPT=HEADER+'\n;(function(){\n"use strict";\n'+CORE+'\n'+GEOMETRY+'\n'+PNG+'\nconst ART_WORKER_SOURCE='+json.dumps(WORKER,ensure_ascii=True)+';\n'+SERVICE+'\nconst ART_CONFIG_SHA=artSha256Sync(new TextEncoder().encode(JSON.stringify(ART_CONFIG)));\nif(typeof module!=="undefined"&&module.exports)module.exports={artRound,artHex,artLab,artDecide,artColors,artGeometry,artDistanceToBackground,artSha256Sync,artDecodeSilhouette,artAffineCollision,artRecommend,artResolveRow,artCreateRuntime,artFormat,artDecodeBytes,artConfig:ART_CONFIG};\nif(typeof window!=="undefined"&&typeof document!=="undefined")artCreateRuntime();\n})();\n'
TARGET=ROOT/'Poke5e Artwork Intelligence.js'
TARGET.write_text(SCRIPT)
import hashlib
print('artifact',TARGET,'bytes',TARGET.stat().st_size,'sha256',hashlib.sha256(TARGET.read_bytes()).hexdigest())
