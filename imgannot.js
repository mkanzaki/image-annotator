/// imgannot.js by KANZAKI, Masahide. ver 2.3, 2017-08-26. MIT license.
"use strict";
var at, Mav = {}, Mau, Mwa;
var OpenSeadragon, viewer, anno;

var Mia = {
	opts: {"showReferenceStrip": true, "showNavigator": null, "refstripbg": "#ca9", "ti": null, "foc": true, "fit": true, "hop": 0.6},
	const: {"noimage": "/works/2016/pub/images/noimage.png", "refspw": 89},
	eltmap: {"osdv": "openseadragon", "maindiv": "main"},
	current : {"keyuri": null, "pos": 0, "dim": {"x":null, "y":null}, "user": {"id": "urn:who.are#you", "numanno": 0},  anno: null, tpos: null, type: null, syncpage: null, center: null, panzoom: true, loading: null, loaded: null, load_fails: 0, is_error: false},
	cinfo: {},
	num: {"user": 1, "imgmeta": 0},
	ent: {"label": null, "description": null, "logo": null, "numTiles": 1},
	jsource: {},
	jsourcem: [],
	oa: {},
	defer: {"paint": {}, "highlight": {}},
	
	
	setup: function (url, data, moreurl){
		Muib.prepare_env("loading JSON");
		if(url === undefined && data === undefined) url = Muib.opts.v.u;
		if(url){
			if(url.match(/^urn:curation:(\d)$/)){
				Miiif.proc_parent_json(RegExp.$1);
				return;
			}
			OpenSeadragon.makeAjaxRequest({
				"url": url,
				"success": function(xhr) {
					Mpj.proc_json(xhr.response, data, moreurl);
				},
				"error": function(e){
					Muib.set_status("auto");
					Muib.main_msg("JSON file load error. "+ e.status+":"+e.statusText, "error");
				}
			});
		}else{
			Mpj.proc_json(data, "");
		}
	},


	init: function (tile, oa, extinfo, type){
		Muib.prepare_env("preparing viewer");
		if(!type) type = "image";
		this.current.type = type;
		Muib.prepare_osdview(tile.length ? "image" : type);
		Muib.main_msg("initial setup ...");
		if(extinfo) this.setup_extinfo(extinfo);
		Muib.set_h1(false);
		Mwa.osda(OpenSeadragon);
		this.prp_tooltips();
		Muib.set_status("wait");
		Mia.ent.numTiles = tile.length;
		try{
			viewer = OpenSeadragon(
				(tile.length === 0 || Miiif.num_video) && !Muib.opts.v.mz ?
				this.media_pseudo_osd(tile, type) : 
				this.prep_osd(tile, type)
			);
		}catch(e){
			console.error(e);
			Muib.main_msg(e.message, "error");
		}
		Muib.main_msg("loading image ...");
		if(viewer.navigator){
			viewer.navigator.element.style.opacity = 0;
			viewer.navigator.element.style.zIndex = -1;
		}
		this.oa = oa;
		this.set_osd_handlers();
		this.set_annotroious_handlers();
		Muib.opts.post_osd();
	},
	prep_osd: function (tile, type){
		this.current.panzoom = true;
		var osdoption = {
			"id" : Mia.eltmap.osdv,
			"prefixUrl" : "/lib/js/osd/images/",
			"showZoomControl" : false,
			"showHomeControl" : false,
			"showRotationControl" : true,
			"minZoomImageRatio" : 0.5,
			"maxZoomPixelRatio" : Muib.opts.v.mz || 3.0,
			"showNavigator" : true
		};
		if(Mia.ent.numTiles > 1 || Muib.struct.data.length > 0){
			osdoption.sequenceMode = true;
			osdoption.showReferenceStrip = true;
			osdoption.referenceStripSizeRatio = 0.1;
			if(Muib.refstrip.vertical) osdoption.referenceStripScroll = "vertical";
			osdoption.tileSources = tile;
			Muib.opts.pre_osd_multi(osdoption);
		}else{
			osdoption.tileSources = tile[0];
			Muib.tindex.state.use = false;
		}
		Muib.tindex.prepare(Muib.elt.osdv);
		Muib.opts.pre_osd(osdoption, type);
		return osdoption;
	},
	media_pseudo_osd: function(tile, type){
		this.current.panzoom = false;
		Muib.tindex.state.use = Muib.struct.data.length ? true : false;
		if(Muib.tindex.state.use){
			Muib.tindex.single_canvas.skip = true;
			Muib.tindex.prepare(Muib.elt.osdv);
		}
		if(this.ent.extinfo) Muib.meta.add({});
		var osdopt = {
			id : Mia.eltmap.osdv,
			prefixUrl : "/lib/js/osd/images/",
			showHomeControl : false,
			showRotationControl : false,
			showFullPageControl: false,
			showZoomControl: false,
			panHorizontal: 	false,
			panVertical: 	false,
			gestureSettingsMouse: {scrollToZoom: false, clickToZoom: false},
			visibilityRatio: 	1,
			showNavigator : false
		};
		if(Mia.ent.numTiles) osdopt.tileSources = tile;
		if(Mia.opts.fit === false){
		}else if(Miiif.locfmedia || Mia.ent.numTiles){
			Muib.reset_osdv_size(Mia.cinfo[Manno.keyuris[0]].dim);
		}else if(type === "audio"){
			Muib.reset_osdv_size(Mau.opts.dim);
		}
		return osdopt;
	},
	setup_extinfo: function(info){
		if(info.base) this.ent = info.base;
		if(info.page){
			this.cinfo = info.page;
			Manno.keyuris = Object.keys(info.page);
		}else{
			this.cinfo[Muib.opts.v.u] = {};
			Manno.keyuris = [Muib.opts.v.u];
		}
		if(info.msg){
			Muib.elt.imgdsc.innerHTML = info.msg;
		}
		if(Muib.opts.v.label){
			Mia.ent.label = Muib.opts.v.label;
		}
		this.ent.extinfo = true;
	},
	set_osd_handlers: function(){
		viewer.addHandler("open", function(e){
			Mia.current.load_fails = 0;
			Mia.current.is_error = false;
			if(Mia.current.type === "image") Mia.proc_loaded(e);
		});
		viewer.addHandler("tile-loaded", function(e){
			if(Mia.current.type === "image"){
				if(Mia.current.loaded !== Manno.key_uri()){
					Mia.current.loaded = Manno.key_uri();
					e.tiledImage.addHandler("fully-loaded-change", function(e){
						Muib.main_msg("done");
						Muib.state.msg_count = 0;
					});
				}
			}else{
				Mia.proc_loaded(e);
			}
		});
		viewer.addHandler("tile-load-failed", function(e){
			Muib.set_status("auto");
			if(++Mia.current.load_fails >= e.tiledImage._tilesLoading){
				console.error("Failed to load w/", Mia.current.load_fails, "errors", e);
				Muib.main_msg("Failed to load tiles " + Mia.current.loading[1], "error");
			}
		});
		viewer.addHandler("open-failed", function(e){
			console.error("open failed", e);
			Muib.set_status("auto");
			Muib.main_msg(Mpj.test_support() || "Failed to open " + (
				Mia.current.loading ? Mia.current.loading[1] :
				Mut.set_fileaction_info("initial", Manno.key_uri())[1]
			), "error");
			Mia.current.is_error = true;
			if(Muib.tindex.clicktg) Muib.tindex.clicktg.className = "fail";
			if(!Mia.setup_done) Mia.proc_loaded(e);
		});
		viewer.addHandler("full-screen", function(e){
			if(Muib.opts.v.inf){
				var p = Mia.current.pos + 1;
				window.top.location = "?u=" + Muib.opts.v.u + (p > 1 ? "#p" + p : "");
			}else if(e.fullScreen) {
				Muib.set_bclass("full", "add");
			}else{
				Muib.set_bclass("full", "remove");
			}
		});
		viewer.addHandler("zoom", function(e){
			if(e.zoom > 1.67) {
				if(! Muib.state.nvshown){
					Muib.fadeio(viewer.navigator.element, 400, 0, 1);
					Muib.state.nvshown = true;
				}
			}else if(Muib.state.nvshown && e.zoom < 1.33){
				Muib.fadeio(viewer.navigator.element, 600, 1, -1);
				Muib.state.nvshown = false;
			}
			if(Muib.opts.dual){
				if(e.refPoint) window.parent.sync_zoom(Muib.opts.v.inf, e.zoom);
			}
		});
		viewer.addHandler("canvas-drag-end", function(e){
			if(Mia.ent.numTiles > 1){
				var sperz = e.speed / viewer.viewport.getZoom();
				if(sperz > Muib.env.flick_threshold)
				viewer.goToPage( (e.direction > -1.57 && e.direction < 1.57 ? -1 : 1) + viewer.currentPage());
			}
		});
		viewer.addHandler("page", function(e){
			if(Manno.clip_hilited){
				Manno.clip_hilited = false;
				Manno.pop_showing = 0;
			}
			Muib.state.msg_count = 0;
		});
		if(Muib.opts.dual) this.set_dualframe_handlers();
		
		viewer.annotator({h: Muib.jld.showbtn, hparam: 'selector'}, Muib.elt.osdv);
	},
	set_dualframe_handlers: function(){
		viewer.addHandler("canvas-press", function(e){
			Mia.current.center = viewer.viewport.getCenter();
		});
		viewer.addHandler("canvas-drag", function(e){
			var c = viewer.viewport.getCenter();
			window.parent.sync_offset(Muib.opts.v.inf, {x: c.x - Mia.current.center.x, y: c.y - Mia.current.center.y});
			Mia.current.center = c;
		});
		viewer.addHandler("page", function(e){
			if(window.parent.initiator){
				window.parent.initiator = null;
			}else{
				window.parent.sync_page(Muib.opts.v.inf, Muib.tindex.get_pos(e.page), Mia.ent.numTiles, Mia.current.syncpage);
			}
			Mia.current.syncpage = Muib.tindex.get_pos(e.page);
		});
	},
	set_annotroious_handlers: function() {
		anno.makeAnnotatable(viewer);
		anno.addHandler("onAnnotationCreated", function(annot){
			Manno.set_new(annot);
		});
		anno.addHandler("onAnnotationUpdated", function(annot){
			annot.modified= at.getUTCdateTime();
			annot.text = at.md2link(annot.text);
			Manno.set_changed(0, annot);
		});
		anno.addHandler("onAnnotationRemoved", function(annot){
			console.log("event", annot);
			Manno.set_changed(-1, annot);
		});
		anno.addHandler("onPopupShown", function(annot){
			Manno.set_frag_annot(annot);
			Manno.hilite_annoclip(annot);
		});
		anno.addHandler("beforePopupHide", function(popup){
			Manno.hilite_annoclip(null);
		});
	},
	prp_tooltips: function(){
		var is_ja;
		var set = {};
		if((is_ja = (Muib.env.lang==="ja"))){
			set = {
				"ZoomIn": "ズームイン",
				"ZoomOut": "ズームアウト",
				"FullPage": "全画面",
				"RotateLeft": "左回転",
				"RotateRight": "右回転",
				"annotator": "注釈",
				"PreviousPage": (Muib.env.rtl ? "次のページ" : "前のページ"),
				"NextPage": (Muib.env.rtl ? "前のページ" : "次のページ")
			};
		}else if(Muib.env.rtl){
			set = {
				"PreviousPage": "Next page",
				"NextPage": "Previous page"
			};
		}
		if(Muib.opts.v.inf) set.FullPage = is_ja ? "この画像のみに" : "This image only";
		for(var btn in set){
			OpenSeadragon.setString("Tooltips."+btn, set[btn]);
		}
		if(Muib.env.rtl && !Muib.opts.v.inf){
			var dirinfo =Mut.dom.elt("div", (is_ja ? "ページ順：右から左" : "Right to Left"));
			dirinfo.id = "dirinfo";
			Muib.elt.osdv.appendChild(dirinfo);
			Muib.elt.dirinfo = dirinfo;
		}

	},
	set_label: function(obj, uri){
		var lb;
		if(obj.label){
			lb = this.cinfo[uri].label =  Mut.get_lang_text(obj.label);
			this.set_maxlabel(lb);
		}
		return lb;
	},
	set_maxlabel: function(lb){
		if(lb.length > Muib.tindex.maxl.len){
			Muib.tindex.maxl.len = lb.length;
			Muib.tindex.maxl.text = lb;
		}
	},

	proc_loaded: function(e, newuri){
		if(!newuri) newuri = Manno.key_uri();
		if(!Mia.setup_done) initialize();
		if((Mia.current.keyuri = Manno.update_anno(Mia.current.keyuri, newuri)))
		var iminfo = Mia.cinfo[Mia.current.keyuri];
		Mia.current.imgurl = (iminfo && iminfo.imgurl) ? iminfo.imgurl : Mia.current.keyuri;
		if(viewer.source) Mia.current.dim = viewer.source.dimensions;
		else if(!Mia.current.is_error) console.warn("no viewer.source", viewer);
		if(iminfo) Muib.layers.add_layer();
		if(Mia.current.type === "image" && !Mia.current.is_error){
			Mia.current.loading = Mut.set_fileaction_info("on", newuri);
			Muib.main_msg("loading " + Mia.current.loading[0] + "...", "normal");
			if(newuri === Mia.current.loaded) console.log("more proc_loaded");
		}
		function initialize(){
			if(Mia.current.type === "image"){
				if(!Mia.current.is_error) Muib.main_msg("on load init ...");
				Mia.setup_done = true;
				
				
				Muib.opts.initial_load();
				Manno.page = Manno.setup_annotation();
				Manno.resolve_deferred(0);
			}else{
				Mav.annot.setup();
				if(Muib.struct.data.length) Muib.tindex.setup({});

				if(Mav.vinfo.bgtile){
				}
			}
		}
		function check_clip(iminfo){
			var item = viewer.world.getItemAt(0);
			if(iminfo.clip){
				var vrect = item.imageToViewportRectangle(iminfo.clip);
				item.setClip(iminfo.clip);
				item.setPosition({
					x: (1 - vrect.width)/2 - vrect.x,
					y: (1/viewer.viewport._contentAspectRatio - vrect.height)/2 - vrect.y
				});
			}
			if(iminfo.baseloc) item.fitBounds(iminfo.layer[0].loc);
		}
	},
	proc_media: function(url, tile, oa, type){
		var avs = Mut.dom.elt("script","",[["src", "avannot.js"]]),
		done = false;
		Mut.dom.append(Mut.dom.get("head")[0], avs);
		var keyurl = Miiif.map[url] || url;
		avs.onload = avs.onreadystatechange = function(){
			if (!done && (!this.readyState || this.readyState === "loaded" || this.readyState === "complete")) {
				done = true;
				if(oa || tile) Mia.init(tile, oa, null, type);
				if(url.match(/^https?:\/\/(www.youtube.com\/watch|youtu.be)/)){
					Mav.init(url, "youtube", tile.length);
				}else{
					Mav.init(url, type, tile.length);
				}
				avs.onload = avs.onreadystatechange = null;
			}
		};
	}
};


var Mpj = {
	ctxs: {
		"webanno": "www.w3.org/ns/anno.jsonld",
		"iiif_p": "iiif.io/api/presentation/",
		"iiif_p2": "iiif.io/api/presentation/2/context.json",
		"iiif_i": "iiif.io/api/image/",
		"iiif_s": "iiif.io/api/search/",
		"iiif": "iiif.io",
		"scv": "www.shared-canvas.org/ns/context.json",
		"iiif_i_sf": "library.stanford.edu/iiif/image-api/1.1/context.json",
		"ixif": "wellcomelibrary.org/ld/ixif/0/context.json",
		"used": null
	},
	other_ctxs: [],
	au_called : false,
	uribase: null,
	type: "Document", 

	proc_json: function (jsonA, jsonB, moreurl){
		if(!jsonA){
			Muib.main_msg("Nothing to process");
		}else if(moreurl){
			Muib.main_msg("parsing first ...");
			this.au_called = true;
			Mia.setup(moreurl, jsonA);
		}else{
			Muib.main_msg("parsing ...");
			var data = this.au_called ? [jsonB, jsonA] : [jsonA, jsonB];
			try{
				Mia.jsource = this.parse_json(data[0]);
				var obj = this.proc_annot(Mia.jsource);
				if(data[1]){
					var revtile = this.get_more_annot(data[1], obj.anno, 0);
					if(revtile && obj.tile.length){
						Muib.main_msg("reverse tile order");
						obj.tile.reverse();
					}
				}
				if(obj === "curation"){
					Miiif.proc_selections(Mia.jsource);
				}else if(obj === "collection"){
				}else if(Object.keys(obj.info.type).length){
					var t = Object.keys(obj.info.type)[0];
					Mia.proc_media(obj.info.type[t][0], obj.tile, obj.anno, t.toLowerCase());
				}else if(Miiif.canvas.offset){
					Mia.proc_media("", obj.tile, obj.anno, "simple");
				}else if(obj.tile.length){
					Mia.init(obj.tile, obj.anno);
				}else{
					var msg = obj.info.error || Mpj.test_support() || "No image specified";
					console.error(msg, ", hence no tile to process.", obj);
					Muib.main_msg(msg, "error");
					Muib.set_h1(false, true);
					Muib.meta.add(Mia.jsource);
				}
			}catch(e){
				console.error(e);
				if(e.message.match(/Unexpected token (.*) in JSON at position (\d+)/)){
					var token = RegExp.$1;
					var pos = Number(RegExp.$2);
					var spos = pos > 20 ? pos - 20 : 0;
					console.log("Error >>> "+(spos ? "...":"") + data[0].substr(spos, 40) + "...");
				}
				Muib.main_msg(e.message, "error");
			}
		}
	},
	parse_json: function(data){
		if(typeof(data)==="object") return data;
		try{
			var json = JSON.parse(data);
		}catch(e){
			this.unparsed = data;
			if(e.message.match(/^(Unexpected token [\r\n\t]|JSON.parse: bad control character|Invalid character)/)){
				console.log("★★ "+RegExp.$1+" in JSON. Will fix...");
				json = JSON.parse(data.replace(/[\r\n\t]/g, " "));
			}else{
				throw e;
			}
		}
		return json;
	},
	
	proc_annot: function (def){
		var tile = [], annot = {}, info = {type:{}};
		var ctxt = this.ctxs.used = this.find_context(def);
		if(ctxt === this.ctxs.webanno){
			this.type = "Web Annotation";
			var imgurls = {};
			this.set_ent_meta(def);
			Mpj.set_direction(def.options, "rlt");
			annot = this.webannot.proc(def, true, imgurls, info);
			for(var url in imgurls){
				if(Muib.env.rtl){
					tile.unshift({"type": "image", "url": url});
				}else{
					tile.push({"type": "image", "url": url});
				}
				Mut.uniq_push(Manno.keyuris, url);
			}
		}else if(ctxt === this.ctxs.iiif_p || ctxt === this.ctxs.scv  || def.sequences || def.content){
			if(ctxt !== this.ctxs.iiif_p){
				Miiif.vers.set_prop(def.type ? 3 : 2);
				Mpj.ctxs.nonstandard = true;
			}
			annot = Miiif.proc_manifest(def, tile, info);
			if(typeof(annot)==="string"){
				this.type = annot;
				return annot;
			}
		}else if(ctxt === this.ctxs.iiif_i || ctxt === this.ctxs.iiif_i_sf){
			this.type = "info.json";
			tile.push(Muib.opts.v.u);
			Mut.uniq_push(Manno.keyuris, Muib.opts.v.u);
			Mia.cinfo[Muib.opts.v.u] = {};
		}else if(def.type){
			this.type = def.type;
			if(def.type === "Collection"){
				Miiif.vers.set_prop(3);
				Mut.set_prop("iiif");
				return Miiif.proc_collection(def);
			}else info.error = "Unknown type " + def.type;
		}else{
			info.error = "Unknown context: " + ctxt;
		}
		if(!info.error) Muib.meta.add(def);
		return {"tile": tile, "anno": annot, "info": info};
	},
	set_ent_meta: function(def){
		Muib.meta.lang.watch = true;
		Mia.ent.label = Mut.get_lang_text(def.label) || null;
		Mia.ent.description = Mut.get_safe_text(def.description) || null;
		Muib.meta.lang.watch = false;
	},
	set_direction: function(def, rtl){
		if(Muib.opts.v.dir){
			Muib.env.rtl = (Muib.opts.v.dir === "rtl");
			return true;
		}
		if(!def) return false;
		var dirprop = def.viewingDirection || def.ViewingDirection;
		if(dirprop && dirprop === rtl) Muib.env.rtl = true;
		return Muib.env.rtl;
	},
	
	get_more_annot: function (json, objanno, idx){
		Muib.main_msg("get more annot ...");
		var def = this.parse_json(json),
		tile_reverse = false,
		set_descr = idx > 0 ? false : true;
		if(def.length === 1) def = def[0];
		Mia.jsourcem.push(def);
		var annot = {}, ctxt = this.find_context(def), info = {type:{}},
		res = {"count": 0};
		if(ctxt === this.ctxs.webanno){
			annot = this.webannot.proc(def, set_descr, null, info);
		}else if((ctxt &&this.is_iiif_ctxt(ctxt)) || def.resources){
			if(def.structures && Muib.struct.data.length===0) Muib.struct.data = def.structures;
			var viewrtl = Muib.env.rtl;
			if(Mpj.set_direction(def, "right-to-left") !== viewrtl) tile_reverse = true;
			if(!Muib.meta.added){
				this.set_ent_meta(def);
				Muib.meta.add(def);
			}else{
				Muib.meta.set_more_prop(def);
			}
			annot = Miiif.proc_embed(def, res, idx);
		}else{
			console.warn("unknown context", ctxt);
			return false;
		}
		if(Object.keys(annot).length){
			for(var uri in annot){
				objanno[uri] = objanno[uri] ? objanno[uri].concat(annot[uri]) : annot[uri];
			}
		}else if(res.count === 0){
			console.log("empty (more) annotation");
			if(!set_descr) Muib.tindex.set_data_an_attr(0);
		}
		return tile_reverse;
	},
	webannot: {
		imgurls: [],
		info: {},
		set_descr: false,
		proc: function(def, set_descr, imgurls, info){
			this.info = info;
			this.imgurls = imgurls;
			this.set_descr = set_descr;
			var ago = this.get_annoset(def), annot = {};
			Mut.set_prop("json-ld");
			for(var i=0, n=ago.length; i<n; i++){
				if(ago[i].target instanceof Array){
					ago[i].target.forEach(function(t){
						var agc = Mut.copy(ago[i]);
						agc.target = t;
						this.proc_target(agc, annot);
					}, this);
				}else{
					this.proc_target(ago[i], annot);
				}
			}
			return annot;
		},

		get_annoset: function(def){
			var anarr = def.items || def.images || [];
			if(def["as:items"]) anarr = anarr.concat(def["as:items"]);
			if(def["@graph"]) anarr = anarr.concat(def["@graph"]);
			return anarr.length ? anarr : [def];
		},
		proc_target: function(ag, annot){
			var tg = ag.target.id || ag.target;
			var url = this.get_base_frag(ag, tg),
			keyuri = url.base;
			if(!Mia.cinfo[keyuri]) Mia.cinfo[keyuri] = {};
			if(url.frag) this.register_anno(annot, ag, url, keyuri);
			else if(this.set_descr){
				var label = Mia.set_label(ag, url.base),
				descr = at.gettext(ag);
				if(!label) Mia.set_label({"label": descr}, url.base);
				Mia.cinfo[keyuri].description = descr;
				if(ag.body instanceof Array) this.multi_body(annot, ag, url, this.info);
			}
			
			if(ag.target.type && ag.target.type !== "Image"){
				this.set_info_type(ag.target.type, url.base, this.info);
			}else{
				if(this.imgurls !== null && ! this.imgurls[url.base]) this.imgurls[url.base] = true;
			}
		},
		set_info_type: function(type, url, info){
			if(info.type[type]) info.type[type].push(url);
			else info.type[type] = [url];
		},
		get_base_frag: function(ag, tg){
			var baseurl, fragment = "", pu = Mut.base_frag(tg);
			if(pu[3]){
				baseurl =pu[0];
				fragment = pu[3];
				if(ag && !ag.target.selector) ag.target = {
					"id": tg, 
					"selector":{"value": fragment}
				};
			}else if(ag.target.selector){
				baseurl = ag.target.source;
				fragment = ag.target.selector.value;
			}else{
				baseurl = pu[0];
			}
			return {"base": baseurl, "frag": fragment};
		},
		register_anno: function(annot, ag, url, keyuri){
			if(! annot[url.base]) annot[url.base] = [];
			if(ag.body){
				if(ag.body instanceof Array) this.multi_body(annot, ag, url, this.info);
				else this.single_body(annot, ag, url);
			} else
				annot[url.base].push(ag);
			
			if(this.set_descr && !Mia.cinfo[keyuri].label){
				Mia.cinfo[keyuri].label = ag.label ? ag.label : at.gettext(ag, 16);
			}
		},
		single_body: function(annot, ago, url){
			annot[url.base].push(this.select_one_body(ago, "body"));
		},
		select_one_body: function(ago, bodyp){
			if(!ago[bodyp]) {
				ago[bodyp] = {"value": "", "type": "TextualBody"};
				return ago;
			}
			if(ago[bodyp].items && (ago[bodyp].type && ago[bodyp].type === "Choice")){
				var agc = Mut.copy(ago);
				agc[bodyp] = Mut.get_lang_obj(ago[bodyp].items);
				if(ago[bodyp].format) agc[bodyp].format = ago[bodyp].format;
				return agc;
			}else{
				return ago;
			}
		},

		multi_body: function(annot, ago, url, info){
			var agc = Mut.copy(ago), media = null, candg = [];
			delete agc.body;
			if(!agc.id) agc.id = at.anbase.pfx + ":" + at.md5(url.base + "#" + url.frag);
			ago.body.forEach(function(b, i){
				var theag = Mut.copy(agc);
				if(typeof(b) === "string"){
					theag.bodyValue = b;
					theag.id += "-" + i;
					candg.push(theag);
				}else if(b.type && b.type === "Audio"){
					media = this.get_base_frag(null, b.id);
					this.set_info_type(b.type, media.base, info);
				}else{
					["creator", "created"].forEach(function(p){
						if(b[p]) theag[p] = Mut.copy(b[p]);
						delete b[p];
					});
					if(b.id){
						theag.id = b.id;
						delete b.id;
					}else{
						theag.id += "-" + i;
					}
					theag.body = b;
					candg.push(this.select_one_body(theag, "body"));
				}
			}, this);
			if(!candg.length){
				agc.bodyValue = "";
				candg.push(agc);
			}
			if(media){
				candg.forEach(function(cg){
					if(typeof(cg.target) === "string") cg.target = {id: cg.target};
					cg.target.media = media;
				});
			}
			annot[url.base] = annot[url.base] ? annot[url.base].concat(candg) : candg;
		}
	},
	
	find_context: function (def){
		if(Muib.opts.v.context) return noscheme(Muib.opts.v.context);
		if(def["options"]) {
			if(Object.assign) Object.assign(Muib.opts.v, def["options"]);
			else Mut.merge(Muib.opts.v, def["options"]);
		}
		var ctxt = Mut.get_first(def)["@context"], context = null, shortc = null;
		if(typeof(ctxt) === "undefined") return ctxt;
		else if(typeof(ctxt) === "string"){
			context = noscheme(ctxt);
			if((shortc = Miiif.vers.check(context))) return shortc;
			else return context;
		}
		var valid = null;
		for(var i in ctxt){
			if(typeof(ctxt[i]) === "object"){
				if(ctxt[i]["@base"]) Muib.state.uribase = this.uribase = ctxt[i]["@base"];
			}else if(typeof(ctxt[i]) === "string"){
				context = noscheme(ctxt[i]);
					if(context === this.ctxs.webanno) valid = context;
					else if((shortc = Miiif.vers.check(context))) valid = shortc;
					else this.other_ctxs.push(context);
			}
		}
		return valid || context;
		
		function noscheme(uri){
			return uri.replace(/^https?:\/{2}/, "").
			replace(/context\.jsonld$/, "context.json");
		}
	},
	test_support: function(){
		var res = null;
		var ms, el;
		if((ms = Mia.jsource.mediaSequences) && (el = ms[0].elements)){
			if(el[0].format && el[0].format.substr(0, 5) === "video"){
				Muib.elt.msg.style.zIndex = -2;
				if(viewer.messageDiv) viewer.messageDiv.style.display = "none";
				var vurl = el[0][Miiif.a.id];
				Muib.main_msg("try loading " + vurl, "normal");
				Mia.proc_media(vurl);
			}else{
				res = "This manifest seems to use unsupported IxIF context. "+
				"Intented content ("+ (el[0].format || el[0][Miiif.a.type]) +") " +
				"might be found at <a href=\"" + el[0][Miiif.a.id] + "\">" + 
				Mut.disp_uri(el[0][Miiif.a.id]) + "</a>.";
				Muib.elt.msg.style.zIndex = 10;
			}
		}
		return res;
	},
	is_iiif_ctxt: function(ctxt){
		return (ctxt.substr(0, 7) === this.ctxs.iiif || ctxt === this.ctxs.scv);
	}
};


var Manno = {
	page: {},
	current: [],
	keyuris: [], 
	tp: {},
	frags: {}, 
	tpfrags: {},
	strange: {}, 
	total: 0, 
	maxgw: 0,
	edit: false, 
	osd_src: "dzi://openseadragon/something",
	temp: null,
	setup_done: false,
	use_avanno: false,
	clip_hilited: false,
	pop_showing: 0,
	
	setup_annotation: function (){
		var annot = {};
		if(Mia.oa && Object.keys(Mia.oa).length){
			for(var uri in Mia.oa) this.oa2annotorious(annot, Mia.oa, uri, this.frags);
			Muib.jld.showbtn();
		}
		;
		if(Mia.ent.numTiles > 1 || Muib.struct.data.length > 0){
			Muib.tindex.setup(annot);
		}else{
			Muib.tindex.set_tiledesc(0, this.keyuris[0]);
		}
		Manno.counter.user(0);
		if(!Mia.current.is_error) Muib.main_msg("annot setup done.");
		return annot;
	},
	oa2annotorious: function (annot, oa, uri, frags){
		var keyuri = this.keyuris.indexOf(uri) >= 0 ? uri : Miiif.map[uri];
		if(!annot[keyuri]) annot[keyuri] = [];
		if(!frags[keyuri]) frags[keyuri] = {};
		for(var i=0, n=oa[uri].length; i<n; i++){
			if(oa[uri][i].target.selector){
				var a = Mwa.to_annotorious(
					oa[uri][i],
					this.osd_src,
					get_dim(keyuri),
					uri,
					frags[keyuri]
				);
				if(a.shapes[0].geometry) this.maxgw = Math.max(this.maxgw, a.shapes[0].geometry.width);
				annot[keyuri].push(a);
			}
		}
		function get_dim(url){
			return (Mia.cinfo[url] && Mia.cinfo[url].dim) ? 
			Mia.cinfo[url].dim : 
			null;
		}
	},
	resolve_deferred: function(idx){
		var tganno, tgfrag, usetp, t, annopagecount = 0;
		if(Muib.opts.v.tp){
			tganno = "tp";
			usetp = true;
			tgfrag = this.tpfrags;
		}else{
			tganno = "page";
			tgfrag = this.frags;
		}
		t = "paint";
		for(var uri in Mia.defer[t][idx]){
			this.oa2annotorious(Manno[tganno], Mia.defer[t][idx], uri, tgfrag);
			if(usetp) set_overlay(uri, Mia.defer[t][idx][uri], t);
			else annopagecount++;
		}
		t = "highlight";
		for(var uri in Mia.defer[t][idx]){
			this.oa2annotorious(Manno.tp, Mia.defer[t][idx], uri, this.tpfrags);
			set_overlay(uri, Mia.defer[t][idx][uri], t);
		}
		Mia.defer.paint[idx] = {};
		return annopagecount;
		
		function set_overlay(uri, oas, t){
			var cinfo = Mia.cinfo[uri];
			if(!cinfo) return false;
			oas.forEach(function(oa){
				var elt = Mut.dom.elt("div", "", [["class", "text" + t]]),
				rect = Muib.pix2viewportRect(oa.loc, cinfo.dim.x);
				elt.innerHTML = at.gettext(oa);
				Mut.add_array(cinfo, "overlay", {"element": elt, "location": rect});
			});
		}
	},
	
	set_new: function(annot){
		this.set_anno_meta(annot, Mia.current.imgurl, viewer.source.dimensions, Miiif.use, "");
		Manno.current.push(annot);
		Muib.clip.showctrl(true);
		var i = this.current.length + 1;
		var box = Mwa.get_annoboxes();
		if(Muib.isTouchDev){
			Mwa.add_touch_listener(box[box.length-1], i, annot);
			Muib.jld.toggle(null, "showjld");
		}
		this.counter.update(1);
	},
	set_changed: function(delta, annot){
		Manno.counter.update(delta);
	},
	set_anno_meta: function(annot, imgurl, dim, use_ratio, more_frag){
		annot.created = at.getUTCdateTime();
		annot.creator = Mia.current.user.id;
		if(!at.whoswho[Mia.current.user.id]) at.registWhoswho(Mia.current.user.id);
		annot.text = at.md2link(annot.text);
		annot.fragid = 
		annot.has_region === false ? more_frag :
		Mwa.getfrag(annot, dim, use_ratio)
		+ more_frag;
		annot.imgurl = imgurl;
		annot.id = Mwa.genid(annot.imgurl, annot.fragid);
		if(!Manno.frags[annot.imgurl]) Manno.frags[annot.imgurl]={};
		Mwa.savefrag(Manno.frags[annot.imgurl], annot, annot.fragid);
	},
	set_frag_annot: function(annot){
		if(! Muib.elt.popbox){
			Muib.elt.popbox = Mut.dom.get(".annotorious-popup-text")[0];
			Muib.elt.popbox.onclick = Muib.popclick;
		}
		if(Mav.char_timer){
			Muib.elt.popbox.innerHTML = Mav.char_timer + Muib.elt.popbox.innerHTML;
			Mav.char_timer = "";
		}
		if(Mia.num.user > 1) Muib.add_pop_more("", annot.creator);
		var frags = Manno.frags[Mia.current.keyuri] ? 
		Manno.frags[Mia.current.keyuri][annot.fragid] : (
			Manno.frags[Mia.current.tpos] ? Manno.frags[Mia.current.tpos] :
			null
		);
		if(frags && frags.length > 1) Manno.multi_annot(annot, frags);
	},
	multi_annot: function (annot, frags){
		var now, more = [], basetype = annot.has_region;
		for(var i=0,n=this.current.length; i<n; i++){
			var id = this.current[i].id;
			if(frags.indexOf(id) !== -1){
				if(this.current[i] === annot){
					now = i;
				}else{
					more.push(i);
				}
			}
		}
		more.forEach(function(i){
			if(this.current[i].has_region === basetype)
			Muib.add_pop_more(this.current[i].text, this.current[i].creator, i);
			else console.log(this.current[i].has_region, basetype);
		}, this);
	},
	flipuser: function(i){
		anno.highlightAnnotation(this.current[i]);
	},
	hilite_annoclip: function(annot){
		if(annot){
			if(Manno.current.length > 25){
			}else if(viewer.world.getItemCount() === 1
				|| Manno.clip_hilited
			){
				var item = viewer.world.getItemAt(0),
				upperitem,
				loc = Mwa.ratio2px(annot, item.source.dimensions, true),
				osdrec = new OpenSeadragon.Rect(loc[0], loc[1], loc[2], loc[3]);
				if(!Manno.clip_hilited){
					viewer.addTiledImage({tileSource: item.source, clip: osdrec});
					Manno.clip_hilited = true;
				}else if((upperitem = viewer.world.getItemAt(1))){
					upperitem.setClip(osdrec);
				}
				item.setOpacity(Muib.opts.v.hop);
				Manno.pop_showing++;
			}
		}else
		if(Manno.clip_hilited){
			Manno.pop_showing--;
			if(!Manno.pop_showing) viewer.world.getItemAt(0).setOpacity(1);
		}
	},

	update_anno: function (prevuri, newuri){
		if(this.use_avanno) return newuri;
		if(prevuri === newuri) return newuri;
		if(prevuri) proc_prev(prevuri, newuri, this);
		this.edit = false;
		if(newuri) proc_new(newuri, this); 
		Muib.tindex.update(prevuri);
		this.update_imgdesc(newuri);
		Muib.set_status("auto");
		return newuri;

		function proc_prev(prevuri, newuri, that){
			if(that.current.length){
				if(that.edit) that.page[prevuri] = that.current;
				if(!Mia.cinfo[prevuri].dim) Mia.cinfo[prevuri].dim = Mia.current.dim;
				if(newuri){
					that.clear_current();
				}
			}else if(that.page[prevuri]){ 
				that.page[prevuri] = null;
			}else if(that.temp){
				anno.highlightAnnotation(undefined);
				anno.removeAnnotation(that.temp);
			}
		}
		function proc_new(newuri, that){
			Muib.clip.toggle(true);
			if(Muib.annobox.show === false) Muib.annobox.toggle();
			if(Mia.cinfo[newuri] && Mia.cinfo[newuri].other && !Miiif.searchs.has_result){
				if(Muib.opts.v.foc === true){
					if(Mia.current.is_error) console.warn("load otherContent cancelled", newuri);
					else Miiif.add_other_content(newuri);
				}else Muib.annobox.oth(newuri);
			}else if(that.page[newuri]){
				that.flush(newuri);
				that.flush_overlay(newuri);
				Muib.annobox.ready(false);
			}else{
				Mia.current.anno = that.current = [];
				that.flush_overlay(newuri);
				Muib.clip.showctrl(false);
				Muib.annobox.ready(true);
			}
		}
	},
	clear_current: function(){
		anno.highlightAnnotation(undefined);
		anno.removeAll();
	},
	flush: function(newuri){
		if(this.page[newuri][0].pix){
			Mwa.check_geometry(this.page[newuri]);
		}else if(Mia.cinfo[newuri].need_dimcheck){
			check_dim(newuri, this);
		}
		flush_annotation(newuri, this);
		Muib.jld.showbtn();
		Muib.clip.showctrl(true);

		function flush_annotation(uri, that){
			Mia.current.anno = that.current = that.page[uri];
			that.current.forEach(function(a){
				if(a.has_region === undefined || a.has_region === true)
				anno.addAnnotation(a);
			});
			if(Muib.isTouchDev) Mwa.setup_touch_listener(that.current);
		}
		function check_dim(uri, that){
			var dim = viewer.source.dimensions;
			if(dim.x !== Mia.cinfo[uri].dim.x || dim.y !== Mia.cinfo[uri].dim.y){
				Mia.cinfo[uri].dim = dim;
				that.page[uri].forEach(function(a){
					Mwa.setup_geometry(a, Mwa.selector2frag(a.fragid, dim));
				});
			}
			Mia.cinfo[uri].need_dimcheck = false;
		}
	},
	flush_overlay: function(uri){
		if(Mia.cinfo[uri] && Mia.cinfo[uri].overlay) Mia.cinfo[uri].overlay.forEach(function(ov){
			viewer.addOverlay(ov.element, ov.location);
		});
	},
	update_imgdesc: function(uri, disp, stepfade){
		var info, label = "<em>" + (Mav.type ? "Media" : "Image") + " info</em>: ";
		if(disp){
			if(stepfade) disp = "<span id=\"stepfade\">" + disp + "</span>";
			info = label + disp;
		}else if(Mia.cinfo[uri]){
			if(Mia.cinfo[uri].description && Mia.cinfo[uri].description !=="undefined") {
				info = label + 
				Muib.meta.fold_text(Mia.cinfo[uri].description, "long").
				replace(/^✍/, "<span class=\"otherCont\">✍</span>");
			}else if (Mia.ent.numTiles > 1){
				info = label;
			}
			if(Mia.cinfo[uri].metadata){
				info += Mia.cinfo[uri].metadata;
				Muib.elt.imgdsc.style.overflowY = "scroll";
				Muib.elt.imgdsc.style.maxHeight = "15em";
			}else if(Mia.num.imgmeta){
				Muib.elt.imgdsc.style.overflowY = "auto";
				Muib.elt.imgdsc.style.maxHeight = "auto";
			}
		}
		if(info) Muib.elt.imgdsc.innerHTML =  info;
		if(stepfade) Muib.stepbgcolor(Mut.dom.get("#stepfade"), 500, [253,246,222], "transparent", 10);
	},

	counter: {
		update: function(delta, other_cont){
			Manno.current = anno.getAnnotations();
			if(delta !== 0) anno_count(delta, this, Manno.current.length, other_cont);
			Manno.edit = true;
			
			function anno_count(delta, that, pagecount, other_cont){
				Manno.total += delta;
				Muib.tindex.ppos.innerHTML = Muib.tindex.ppos.innerHTML.replace(/\d+ ann.*/, Muib.tindex.anno_disp());
				Muib.tindex.set_data_an_attr(pagecount);
				that.user(delta, other_cont);
				if(pagecount === 0) Muib.annobox.btn.disabled = true;
				else if(pagecount ===1 && delta) Muib.annobox.btn.disabled = false;
			}
		},
		user: function (delta, other_cont){
			if(delta !== 0){
				if(Mia.current.user.numanno === 0 && ! other_cont) {
					at.registWhoswho(Mia.current.user.id);
				}
				Mia.current.user.numanno += delta;
				if(Mia.current.user.numanno === 0){
					delete at.whoswho[Mia.current.user.id];
				}
			}
			Mia.num.user = Object.keys(at.whoswho).length;
		}

	},
	get_annotation: function (as_page_chbx){
		this.update_anno(this.key_uri());
		return Mwa.getanno(Miiif.use, this.prepare_get_anno({}), Mpj.uribase, null, "Image", as_page_chbx.checked);
	},
	prepare_get_anno: function(amap){
		var uri, annojson = [];
		for(uri in this.page){
			var dim = Mia.cinfo[uri].dim;
			for(var i=0, n=this.page[uri].length; i<n; i++){
				var an = this.page[uri][i];
				if(an.id === "_pseudo") continue;
				an.imgurl = Mia.cinfo[uri].imgurl ? Mia.cinfo[uri].imgurl : uri;
				an.dim = dim;
				annojson.push(an);
				amap[an.id] = an;
			}
		}
		return annojson;
	},
	test_strange: function(){
		var temp = {}, frag = {};
		for(var uri in this.strange){
			Manno.oa2annotorious(temp, this.strange, uri, frag);
			var atemp = temp.undefined;
			Mwa.check_geometry(atemp);
			atemp.forEach(function(a){anno.addAnnotation(a);});
		}
	},
	
	key_uri: function (){
		var s = viewer.source; 
		var uri = s ? (s.canvas || s.url) : null;
		if(uri){
			return uri;
		}else{
			return this.keyuris[Muib.tindex.get_pos(viewer.currentPage())];
		}
	},
	pseudo_anno: function(text, frag, keyuri){
		if(this.temp) anno.removeAnnotation(this.temp);
		if(!keyuri) keyuri = this.key_uri();
		var geom = Mwa.selector2frag(frag, Mia.cinfo[keyuri].dim);
		var anobj =  {
			"src" : this.osd_src, 
			"text" : text,
			"id": "_pseudo",
			"shapes" : [{"type" : "rect"}]
		};
		Mwa.setup_geometry(anobj, geom);
		anno.addAnnotation(anobj);
		anno.highlightAnnotation(anobj);
		this.temp = anobj;
	}

};



var Miiif = {
	use: false,
	map: {},
	dzi: false,
	tfmedia: 0,
	locfmedia: 0,
	medias: {},
	num_video: 0,
	max_cvmedia: 0,
	cvulist: [],
	viewingHint: null,
	usedSeq: null,
	a: null,
	v: null,
	vers: {
		v: null,
		attrs: {
			v2: {id: "@id", type: "@type", content: "images", body: "resource", target: "on"},
			v3: {id: "id", type: "type", content: "content", body: "body", target: "target"}
		},
		vals: {
			v2: {image: "dctypes:Image", video: "dctypes:Video", audio: "dctypes:Audio", annotation: "oa:Annotation", collection: "sc:Collection", annolist: "oa:AnnotationList", annocollection: "oa:AnnotationCollection"},
			v3: {image: "Image", video: "Video", audio: "Audio", annotation: "Annotation", collection: "Collection", annolist: "AnnotationPage", annocollection: "AnnotationCollection"}
		},
		pat_iiif: new RegExp("^(" + 
			Mpj.ctxs.iiif_p + "|" + 
			Mpj.ctxs.iiif_s + "|" + 
			Mpj.ctxs.iiif_i + 
			")(\\\d)/context"
		),
		check: function(context){
			if(context.match(this.pat_iiif)){
				this.v = RegExp.$2;
				if(Number(this.v) < 2) this.v = 2;
				this.set_prop(Number(this.v));
				return RegExp.$1;
			}else if(context.match("^" + Mpj.ctxs.iiif)){
				this.v = 2;
				return Mpj.ctxs.iiif;
			}else return false;
		},
		set_prop: function(ver){
			if(ver > 3){
				throw new Error("Unkown IIIF version "+ver);
			}else if(ver < 2 || (ver > 2 && ver < 3)){
				console.log("Earlier version "+ ver + "? treated as ver 2");
				ver = 2;
			}else if(!this.v) this.v = ver;
			Miiif.a = this.attrs["v" + ver];
			Miiif.v = this.vals["v" + ver];
			Miiif.use = true;
			Miiif.canvas.init();
		}
	},
	get_type: function(r){
		return r[this.a.type] ? (
			Mut.get_first(r[this.a.type]).replace(/^\w+:/, "") 
		) : undefined;
	},
	proc_manifest: function(def, tile, info){
		Mut.set_prop("iiif");
		Mpj.set_ent_meta(def);
		Mpj.set_direction(def, "right-to-left");
		if(def.mode === "noshrink") Mia.opts.fit = false;
		var annot = {}, type;
		if(def.mediaSequences){
			type = "ixif manifest";
			this.proc_ixif_media(def, tile, info);
		}else if(def.sequences){
			type = "Manifest";
			check_options(def, this);
			annot = this.proc_seq(def, tile, info);
			if(def.structures) Muib.struct.data = def.structures;
		}else if((type = this.get_type(Mut.get_first(def)))){
			switch(type){
			case "Collection":
				return this.proc_collection(def);
			case "Curation":
				return "curation";
			case "Annotation":
			case "AnnotationList":
				info.error = "This looks like " + type + " to be used with main manifest";
				break;
			case "Canvas":
				console.warn("Root type Manifest expected, rather than", type);
				if(def.structures) Muib.struct.data = def.structures;
				check_options(def, this);
				annot = this.canvas.proc(tile, this.a.content, def, info);
				break;
			case "Manifest":
				if(def.structures) Muib.struct.data = def.structures;
				check_options(def, this);
				annot = this.proc_seq(def, tile, info);
				break;
			default:
				info.error = "Unknown IIIF type " + type;
			}
		}else{
			info.error = "IIIF context, but no type nor sequence found.";
		}
		if(type) Mpj.type = type;
		return annot;
		
		function check_options(def, that){
			that.viewingHint = def.viewingHint;
			that.get_start_canvas(def);
		}
	},
	proc_seq: function(def, tiles, info){
		var sqs, sq, cvs;
		if(!(sqs = def.sequences)) return test_noseq(def, tiles, info, this);
		else if(sqs instanceof Array){
			if(sqs.length === 0) return set_error("No Sequence found in the list", info);
			sq = sqs[0];
		}else{
			sq = sqs;
			sqs = false;
			console.warn("sequences value must be a list");
		}
		if(!(cvs = sq.canvases)){
			if(typeof(sq) !== "object") return set_error("Not a valid Sequence", info);
			else return set_error(sqs === false ?
			"sequences value is not a list nor a valid Sequence" :
			"canvases property not found in Sequence", info);
		}
		if(!(cvs instanceof Array)) return set_error("canvases property value must be a list", info);
		if(cvs.length === 0) return set_error("No canvas found in the list", info);
		var contprop = cvs[0].resources ? "resources" : this.a.content,
		annot = {}, cvanno;
		Mpj.set_direction(sq, "right-to-left");
		this.get_start_canvas(sq);
		this.usedSeq = sq;
		cvs.forEach(function(cv){
			if((cvanno = this.canvas.proc(tiles, contprop, cv, info)))
			Mut.merge(annot, cvanno);
		}, this);
		return annot;
		
		function set_error(msg, info){
			info.error = msg;
			return false;
		}
		
		function test_noseq(def, tiles, info, that){
			if(that.vers.v >= 3 && def[that.a.content]){
				console.warn("This must have type Canvas, rather than", def.type);
				return that.canvas.proc(tiles, that.a.content, def, info);
			}else return set_error("sequences property not found", info);
		}
	},
	canvas: {
		tiles: [],
		annot: {},
		a: null,
		v: null,
		cv: null,
		cvuri: "",
		cinfo: null,
		info: null,
		durmax: 0,
		medias: 0,
		offset: 0,
		current_mediaurl: null,
		init: function(){
			this.a = Miiif.a;
			this.v = Miiif.v;
		},
		tilemap: {},
		proc: function(tiles, contprop, cv, info){
			if(typeof(cv) !== "object"){
				info.error = "Not a valid canvas";
				return false;
			}
			if(!(this.cvuri = cv[this.a.id])) console.error("No id for canvas", cv);;
			Miiif.cvulist.push(this.cvuri);
			this.cv = cv;
			this.tiles = tiles;
			this.info = info;
			if(!Mia.cinfo[this.cvuri]) Mia.cinfo[this.cvuri] = {};
			this.cinfo = Mia.cinfo[this.cvuri];
			this.cinfo.dim = set_dimension(cv);
			this.cinfo.mf = {};
			this.duration = cv.duration;
			this.durmax = 0;
			this.medias = 0;
			var cvcon = cv[contprop] ? (cv[contprop] instanceof Array ? cv[contprop] : [cv[contprop]]) : null;
			if(cvcon) cvcon.forEach(function(cont){
				if(typeof(cont) !== "object"){
					console.warn("Not a valid Annotation of type", typeof(cont));
					return;
				}
				var type = Mut.get_first(cont[this.a.type]);
				if(type === this.v.annotation){
					this.proc_one_item(cont);
				}else if(type === this.v.annolist){
					cont.items.forEach(function(item){
						this.proc_one_item(item);
					}, this);
				}else if(cont.format === "video/mp4"){
					this.set_mediaurl(cont[this.a.id], "Video", null, cont.format);
				}else if(cont.format === "audio/mp3"){
					this.set_mediaurl(cont[this.a.id], "Audio", null, cont.format);
				}
			}, this);
			else this.proc_missing();
			if(this.duration){
				this.cinfo.duration = cv.duration;
				this.cinfo.offset = this.offset;
				this.offset += cv.duration;
				this.cinfo.trange = [this.cinfo.offset, this.offset];
			}else{
				this.cinfo.duration = this.durmax;
			}
			if(cv.thumbnail) this.cinfo.thumbnail = cv.thumbnail;
			Miiif.max_cvmedia = Math.max(Miiif.max_cvmedia, this.medias);
			
			if(cv.otherContent){
				cv.otherContent.forEach(function(oth){
					this.content_annot(oth, this.cvuri);
				}, this);
			}
			var lb = Mia.set_label(cv, this.cvuri);
			if(cv.description){
				this.cinfo.description = Mut.get_safe_text(cv.description);
			}
			this.set_canvas_meta(cv);
			
			return this.annot;
			
			function set_dimension(cv){
				var dim = {}, prop = {"x": "width", "y": "height"}, type, invalid = [];
				for(var key in prop){
					if(!cv[prop[key]]){
						if(!cv.duration) invalid.push(prop[key] + ": undefined");
					}else if((type = typeof(cv[prop[key]])) !== "number"){
						var val = Number(cv[prop[key]]);
						if(isNaN(val)) invalid.push(prop[key] +": " + cv[prop[key]]);
						else invalid.push(prop[key] + ": " + type);
						dim[key] = val;
					}else dim[key] = cv[prop[key]];
				}
				dim.temp = true;
				if(invalid.length) console.warn("Invalid canvas dimension(s)", invalid.join(", "));
				return dim;
			}
		},
		
		proc_one_item: function(item){
			var r_array = this.get_bodies(item, this.a.body),
			tg = item[this.a.target];
			if(!tg) console.warn("No target specified");
			r_array.forEach(function(r){
				if(!r) return;
				var type = Miiif.get_type(r);
				switch(type){
				case "Video" :
				case "Audio" :
					this.set_mediaurl(r[this.a.id], type, tg, r.format, item.timeMode);
					break;
				case Miiif.v.annocollection :
					this.content_annot(r, this.cvuri);
					break;
				case "TextualBody" :
					var agc = Mut.copy(item);
					agc[this.a.target] = tg;
					agc[this.a.body] = r;
					Miiif.proc_one_embed(agc, this.annot, 0);
					break;
				case "Image" :
					this.image_and_tile(r, tg, item.stylesheet);
					break;
				case "Choice" :
					this.set_choice(r, tg, item.stylesheet);
					break;
				case undefined :
				default :
					this.guess_type(r, tg, item.stylesheet);
				}
			}, this);
		},
		get_bodies: function(item, bodyp){
			if(typeof(item) === "string"){
				var r = {};
				r[this.a.id] = item;
				return [r];
			}else{
				if(item[bodyp] instanceof Array){
					return item[bodyp];
				}else{
					if(!item[bodyp]) {
						return  [{"value": "", "type": "TextualBody"}];
					}else{
						return [item[bodyp]];
					}
				}
			}
		},
		set_choice: function(r, tg, styles){
			var items = r.items || r.item,
			type = Miiif.get_type(items[0]);
			switch(type){
			case "Video" :
			case "Audio" :
				var urls = [], format = [];
				items.forEach(function(item){
					urls.push(item[this.a.id]);
					format.push(item.format);
				}, this);
				this.set_mediaurl(urls, type, tg, format, r.timeMode);
				break;
			case "Text":
				if(items[0].format && items[0].format==="text/vtt"){
					this.set_vtt(items);
					break;
				}
			case "TextualBody":
				console.log("one item-> choice of body->",type);
				Mpj.webannot.multi_body(this.annot, items, {base:this.cvuri}, this.info);
				break;
			case "Image" :
				if(r.items){
					this.image_and_tile(items.shift(), tg, styles);
				}else{
					if(r.default) this.image_and_tile(r.default, tg, styles);
				}
				var loct = this.calc_loct(tg);
				items.forEach(function(item){
					this.set_layers(item, this.set_tile(item, loct, styles), tg, loct);
				}, this);
				this.cinfo.choice = true;
				break;
			default:
				console.log("who knows?", type, r);
			}
		},
		image_and_tile: function(r, tg, styles){
			var loct = this.calc_loct(tg),
			tile = this.set_tile(r, loct, styles);
			if(tile.error){
				console.error(tile.error, this.cv);
			}else if(this.cinfo.imgurl){
				this.set_layers(r, tile, tg, loct);
			}else{
				if(Muib.env.rtl){
					this.tiles.unshift(tile);
				}else{
					this.tiles.push(tile);
				}
				if(typeof(tile)==="string") this.tilemap[tile] = this.cvuri;
				this.set_mediaurl(r[this.a.id] || loct[4], "Image", tg);
				if(loct[2]){
					if(loct[1]){
						this.cinfo.timedlayer = true;
						Miiif.tfmedia ++;
					}
					if(! this.cinfo.layer) this.cinfo.layer = [];
					this.cinfo.layer[0] = {
						"tile": null,
						"tid": loct[4],
						"label": "base image",
						"loc": loct[0],
						"trange": loct[1]
					};
				}
				if(loct[0]) this.cinfo.baseloc = true;
			}
		},
		set_layers: function(r, tile, tg, loct){
			if(! this.cinfo.layer) this.cinfo.layer = [{"label": "base image", "tile": null}];
			var tgp = Mut.base_frag(tg),
			rf = r.full || r.default || r,
			ctx = (rf.service && rf.service["@context"]) ?
			rf.service["@context"].match(/\/([\d\.]+)\/context.json$/) : null,
			layer = {
				"tile": tile,
				"tid": loct[4],
				"label": rf.label || null,
				"level": ctx ? ctx[1] : 0,
				"loc": loct[0],
				"trange": loct[1]
			};
			if(loct[1]){
				this.cinfo.timedlayer = true;
				Miiif.tfmedia ++;
			}
			this.cinfo.layer.push(layer);
		},
		calc_loct: function(tg){
			var tgp = Mut.base_frag(tg), res = [null, null];
			if(tgp[1]) res[0] = Muib.pix2viewportRect(tgp[1], this.cv.width);
			if(tgp[2]) res[1] = Mut.split_as_num(tgp[2]);
			res[2] = res[0] !== null || res[1] !== null;
			return res;
		},
		set_mediaurl: function(urls, type, tg, formats, timeMode){
			var url, formats;
			if(typeof(urls)==="string"){
				urls = [urls];
				formats = [formats];
			}
			var url = urls.shift(),
			format = formats.shift(),
			parsed = Mut.base_frag(url), 
			murl = parsed[0];
			Mut.uniq_push(Manno.keyuris, this.cvuri);
			this.current_mediaurl = murl;
			this.medias++;
			var prop;
			if(type === "Image"){
				prop = "imgurl";
			}else{
				if(type === "Video") Miiif.num_video++;
				prop = "mediaurl";
				Mpj.webannot.set_info_type(type, murl, this.info);
				if(Miiif.medias[murl]) Miiif.medias[murl].count++;
				else Miiif.medias[murl] = {count: 1}; 
				this.cinfo.map = this.cvuri;
				if(!this.cinfo.mf[murl]) this.cinfo.mf[murl] = [];
				var u = Mut.base_frag(tg), mf = {"type": type};
				this.set_mf(mf, u[1], u[2], parsed[1], parsed[2], format, timeMode);
				if(urls.length) mf.choice= {"id": urls, "format": formats};
				this.cinfo.mf[murl].push(mf);
			}
			this.cinfo[prop] = murl;
			Miiif.map[murl] = this.cvuri;
		},
		set_mf: function(mf, loc, tfrag, bodypos, bodyt, format, timeMode){
			if(loc){
				mf.loc = "#xywh=" + loc;
				mf.pos = Mut.split_as_num(loc);
				Miiif.locfmedia++;
			}
			if(tfrag){
				mf.t = Mut.split_as_num(tfrag);
				this.cinfo.timedlayer = true;
				Miiif.tfmedia ++;
				this.durmax = Math.max(mf.t[1], this.durmax);
			}
			if(bodypos) mf.bodypos = Mut.split_as_num(bodypos);
			if(bodyt) mf.bodyt = Mut.split_as_num(bodyt);
			if(format) mf.format = format;
			if(timeMode) mf.timeMode = timeMode;
		},
		set_vtt: function(items){
			if(!(items instanceof Array)) items = [items];
			var vtt = [],
			mf = this.cinfo.mf[this.current_mediaurl],
			len = mf.length;
			items.forEach(function(item){
				vtt.push({
					"id": item[this.a.id],
					"label": item.label,
					"language": item.language
				});
			}, this);
			mf[len-1].vtt = vtt;
		},
		guess_type: function(r, tg, styles){
			var id = Mut.get_oneuri(r); //typeof(r) === "string" ? r : r[this.a.id];
			if(!id && r.source){
				r = r.source;
				id = Mut.get_oneuri(r);
			}
			var m = id ? id.match(/^(.*\.)([^\.#]+)(#[^#]+)?$/) : null;
			if(m){
				var uri = m[1] + m[2];
				switch(m[2]){
				case "mp4":
					this.set_mediaurl(id, "Video", tg);
					break;
				case "mp3" :
				case "m4a" :
					this.set_mediaurl(id, "Audio", tg);
					break;
				case "jpg" :
				case "png" :
					this.image_and_tile(r, tg, styles);
					break;
				case "vtt" :
					this.set_vtt(r);
					break;
				default:
					console.warn("Unknown type", m[2], r);
					return false;
				}
			}else{
				this.image_and_tile(r, null, styles);
			}
		},
		set_tile: function(r, loct, styles){
			if(!r) return  {"error": "no image resouce"};
			var tsource, rf = r.full || r.default || r;
			if(rf.service){
				var rs = Mut.get_first(rf.service);
				if(rs.profile === "http://schemas.microsoft.com/deepzoom/2008"){
					tsource = loct[4] = rs[this.a.id];
				}else{
					tsource = loct[4] = rs[this.a.id] + (rs[this.a.id].match(/\/$/) ? "" : "/") + "info.json";
				}
			}else{
				var url = Mut.get_oneuri(rf);
				if(!url) return  {"error": "no image resouce"};
				else if(url === "rdf:nil") url = Mia.const.noimage;
				else if(url.match(/example\.(org|net|com)\/(.*)$/)) url = "/works/2016/pub/images/" + RegExp.$2;
				loct[4] = url;
				tsource = {"type": "image", "url": url, "canvas": this.cv[this.a.id]};
			}
			var opts = this.check_options(r, rf, loct[0], styles);
			if(opts){
				tsource = opts.tileSource = tsource;
				return opts;
			}else{
				return tsource;
			}
		},
		check_options: function(r, rf, bound, styles){
			var frag, count = 0, res = {};
			if(bound){
				res.fitBounds = bound;
				count++;
			}
			if(!r.selector){
				var loc = Mut.base_frag(r[this.a.id]);
				frag = loc[1];
			}else{
				frag = r.selector.value ? r.selector.value.substr(5) : r.selector.region;
			}
			if(frag){
				res.clip = Muib.pix2osdRect(frag);
				count++;
			}
			var m = r[this.a.id] ? r[this.a.id].match(/\/([\d\.\-]+)\/(default|native).jpg$/) : null;
			if(m && m[1] !== "0"){
				res.degrees = Number(m[1]);
				count++;
			}else if(styles){
				if(styles.chars && styles.chars.match(/rotate\(([\d\.\-]+)deg\)/)){
					res.degrees = Number(RegExp.$1);
					count++;
				}
			}
			return count ? res : null;
		},
		set_canvas_meta: function(obj){
			var meta = "", mar = [],
			more = {"seealso": "See also", "related": "Related", "rendering": "Rendering"};
			if(obj.metadata) meta = Muib.meta.set_metalist(obj.metadata);
			Object.keys(more).forEach(function(key){
				Muib.meta.set_val_data(mar, obj[key], more[key]);
			});
			meta += Muib.meta.gen_dtdd(mar);
			if(meta) this.cinfo.metadata = "<dl>\n" + meta + "</dl>";
			Mia.num.imgmeta++;
		},
		content_annot: function(oth, uri){
			if(!Mia.cinfo[uri].other) Mia.cinfo[uri].other = [];
			Mia.cinfo[uri].other.push(oth[this.a.id] || oth);
		},
		
		proc_missing: function(){
			this.tiles.push({"type": "image", "url": Mia.const.noimage, "canvas": this.cvuri});
			Mut.uniq_push(Manno.keyuris, this.cvuri);
		}
		
	},
	proc_embed: function (def, res, idx){
		Muib.set_status("wait");
		Muib.main_msg("proc embed...", "normal");
		var annot = {};
		if(def["resources"]){
			res.count += proc_resources(def["resources"], annot, this);
		}else if(def instanceof Array){
			if(def[0]["resources"]){
				for(var i=0,n=def.length; i<n; i++) 
				res.count += proc_resources(def[i]["resources"], annot, this);
			}else if(def[0]["resource"]){
				for(var i=0,n=def.length; i<n; i++) 
				res.count += this.proc_one_embed(def[i], annot, idx);
			}
		}
		return annot;

		function proc_resources(defrs, annot, that){
			var rescount = 0;
			if(defrs instanceof Array){
				defrs.forEach(function(rs){
					rescount += that.proc_one_embed(rs, annot, idx);
				}, that);
			}else{
				rescount += that.proc_one_embed(defrs, annot, idx);
			}
			return rescount;
		}
	},
	proc_one_embed: function(rs, annot, idx){
		var val, tg = rs[this.a.target], body = rs[this.a.body];
		if(body instanceof Array) body = body[0];
		var type = this.get_type(body);
		switch(type){
		case "ContentAsText":
		case "Text":
			val = (typeof(body.chars) !== "undefined") ?
			body.chars : (body.full ? body.full.chars : 
				"(" + (body[this.a.id] ? (tg.match(/#xywh/) ? 
					"[external resource](" + body[this.a.id] + ")" :
					"<a href=\"" + body[this.a.id] + "\">external resource</a>") :
					"empty string") +")" ); 
			break;
		case "TextualBody":
			val = body.value;
			break;
		case "Image":
			val = (body.label || "") + "![--](" + body[this.a.id] + ")";
			body.format = "";
			break;
		default:
			console.warn("unknown type", body[this.a.type]);
		}
		if(val === undefined) return 0;
		if(!(tg instanceof Array)) tg = [tg];
		var count = 0;
		tg.forEach(function(tt){
			var tgparts;
			if(typeof(tt)==="string"){
				tgparts = Mut.base_frag(tt);
			}else{
				if(tt[this.a.id])
					tgparts = Mut.base_frag(tt[this.a.id]);
				else
					tgparts = [tt.source || tt.full, "", "", tt.selector ? tt.selector.value : ""];
			}
			if(tgparts[3]){
				var surl = tgparts.shift(), frag = tgparts.pop(),
				id = body[this.a.id];
				if(typeof(rs.motivation)==="string"
					&& rs.motivation.match(/(paint|highlight)ing$/) 
					&& !Miiif.searchs.req
				){
					Mut.prepare_obj(Mia.defer[RegExp.$1], idx);
					set_annot(Mia.defer[RegExp.$1][idx], surl, id, val, body, frag, rs.motivation, tgparts);
					count++;
				}else{
					set_annot(annot, surl, id, val, body, frag, rs.motivation);
					count++;
				}
			}else if(Mia.cinfo[tgparts[0]]){
				Mia.cinfo[tgparts[0]].description = "✍" + Mut.get_safe_text(val);
				count++;
			}else{
				console.warn("Unknown target", tt);
			}
		}, this);
		return count;
		
		function set_annot(tgannot, surl, id, val, body, frag, motivation, tgp){
			var oa = {
				"type" : "cnt:ContextAsText",
				"id": id,
				"body" : {
					"value": val,
					"format": body.format || (body.full ? body.full.format : "text/plain")
				},
				"target" : {
					"source" : surl,
					"selector" : {"value" : frag}
				}
			};
			if(motivation) oa.motivation = motivation;
			if(tgp){
				oa.loc = tgp[0];
				oa.trange = tgp[1];
			}
			Mut.add_array(tgannot, surl, oa);
		}
	},

	add_other_content: function (uri){
		Muib.set_status("wait");
		Muib.main_msg("other content...");
		var othercon = Mut.copy(Mia.cinfo[uri].other),
		urib = uri.match(/http:/) ? uri.replace(/http:/, "https:") : (
			uri.match(/https:/) ? uri.replace(/https:/, "http:") : null
		),
		finidx = othercon.length - 1,
		oacount = 0;
		Mia.cinfo[uri].other = null;
		
		
		othercon.forEach(function(othuri, i){
			var oa = {},
			annot = {};
			OpenSeadragon.makeAjaxRequest({
				"url": othuri,
				"success": function(xhr) {
					Mpj.get_more_annot(xhr.response, oa, i+1);
					if(oa[uri]){
						merge_annot(annot, oa, uri, uri, i);
					}else if(oa[urib]){
						oa[uri] = oa[urib];
						delete(oa[urib]);
						merge_annot(annot, oa, uri, uri, i);
					}else if(oa[Mia.cinfo[uri].mediaurl]){
						merge_annot(annot, oa, uri, Mia.cinfo[uri].mediaurl, i);
					}else if(Object.keys(oa).length){
						for(var u in oa) Manno.strange[u] = oa[u];
						if(Muib.opts.v.strange) Manno.test_strange();
					}else if(Mia.defer.paint[i+1] || Mia.defer.highlight[i+1]){
						merge_tp(oa, uri, i);
					}else{
					}
					Manno.update_imgdesc(uri);
					Muib.set_status("auto");
				},
				"error": function(e){
					console.error(e);
					Muib.set_status("auto");
					Muib.tindex.set_data_an_attr(0);
				}
			});
		});

		function merge_annot(annot, oa, keyuri, tguri, curidx){
			if(Mav.type){
				Mav.annot.do_setup(oa, curidx+1);
				if(Mav.type === "audio") Mau.set_audio_msg();
				else Muib.main_msg("merging annot done");
			}else{
				Manno.oa2annotorious(annot, oa, tguri, Manno.frags);
				Mut.concat_array(Manno.page, keyuri, annot[keyuri]);
				oacount += annot[keyuri].length;
				oacount += Manno.resolve_deferred(curidx+1);
				test_complete(keyuri, curidx);
			}
			Mut.set_prop("iiif");
		}
		function merge_tp(oa, keyuri, curidx){
			if(Mav.type){
				Mav.annot.do_setup(oa, curidx+1);
			}else{
				oacount += Manno.resolve_deferred(curidx+1);
				test_complete(keyuri, curidx);
			}
		}
		function test_complete(keyuri, curidx){
			if(curidx === finidx){
				if(oacount){
					Manno.flush(keyuri);
					Manno.counter.update(oacount - 1, true);
				}
				if(Mia.cinfo[uri].overlay) Manno.flush_overlay(keyuri);
			}
		}
	},
	get_start_canvas: function(def){
		if(def.startCanvas && !Muib.opts.v.canvas){
			var cvid = Mut.get_oneuri(def.startCanvas),
			pu = Mut.base_frag(cvid);
			Muib.opts.v.canvas = pu[0];
			if(pu[2] && !Muib.opts.v.t) Muib.opts.v.t = pu[2];
		}
	},

	full2mid: function (url, width){
		if(url.match(/^(.+\/full)\/full\/([^\/]+\/[^\/]+)$/)){
			url = RegExp.$1 + "/" + (width || 1000) +",/" + RegExp.$2;
		}
		return url;
	},
	
	
	proc_collection: function (def){
		var div = Mut.dom.elt("div");
		Mia.ent.label = def.label ? Mut.get_lang_text(def.label) : "IIIF Manifest Collection";
		["description", "attribution"].forEach(function(fld){
			if(def[fld]) Mut.dom.append(div, Mut.dom.append(
				Mut.dom.elt("div"), 
				[Mut.dom.elt("dfn", fld), Mut.dom.ashtml(": " + 
					Muib.meta.fold_text(Mut.get_safe_text(def[fld]), "xlong")
				)]
			));
		});
		if(Muib.opts.v.mode && Muib.opts.v.mode.substr(0,3) === "tbl"){
			simple_table(def, div, Muib.opts.v.mode.substr(3));
			this.collection_sate.check(false);
		}else{
			var closed = (def.collapse && def.collapse===true) || num_children(def) >= 10 ?  true : false;
			var opened = this.collection_sate.check(true);
			var Fldrid = 0;
			list_items(def, div);
		}
		Mut.dom.get("#main").replaceChild(div, Muib.elt.osdv);
		Muib.set_h1(true);
		Muib.clip.showctrl(false);
		window.onscroll = function(){Miiif.collection_sate.save_pos();};
		if(Miiif.collection_sate.toScroll){
			document.body.scrollTop = Miiif.collection_sate.toScroll;
			Miiif.collection_sate.toScroll = null;
		}
		return "collection";
		
		function list_items(def, pnode, len){
			var pul = Mut.dom.elt("ul"), found = false;
			pul.className = "collection" + (len && len > 20 ? " mu" : "");
			if(def.collections){
				list_collections(def.collections, pul);
				found = true;
			}
			if(def.manifests){
				list_manifests(def.manifests, pul, false);
				found = true;
			}
			if(def.members){
				proc_members(def.members, pul);
				found = true;
			}
			if(!found){
				console.log(def);
				pul = Mut.dom.elt("p", "Unknown format");
			}
			Mut.dom.append(pnode, pul);
		}
		function list_collections(cols, pul){
			cols.forEach(function(col){
				proc_one_collection(col, pul);
			});
		}
		function proc_one_collection(col, pul){
			var li, len = num_children(col);
			if(len){
				li = Muib.prep_folder(
					Mut.get_lang_text(col.label) + "(" + len + ")", 
					(opened[Fldrid]===undefined ? closed : opened[Fldrid]!=="true"), 
					"ul"
				);
				li.setAttribute("data-fldr", Fldrid++);
				if(col.description) Mut.dom.append(li, Mut.dom.append(Mut.dom.elt("div", "", [["class", "descr"]]), Mut.dom.ashtml(col.description)));
				list_items(col, li, len);
			}else{
				li = gen_one_li(col);
			}
			Mut.dom.append(pul, li);
		}
		function list_manifests(mans, pul, uselabel){
			mans.forEach(function(man){
				Mut.dom.append(pul, gen_one_li(man));
			});
		}
		function proc_members(membs, pul){
			membs.forEach(function(memb){
				if(memb[Miiif.a.type] === Miiif.v.collection){
					proc_one_collection(memb, pul);
				}else{
					Mut.dom.append(pul, gen_one_li(memb));
				}
			});
		}
		function gen_one_li(item){
			var li = one_item_elt("li", item);
			if(item.description){
				Mut.dom.append(li, Mut.dom.append(Mut.dom.elt("span", "", [["class", "descr"]]), Mut.dom.ashtml(" - " + Mut.get_safe_text(item.description))));
			}
			if(item.thumbnail) 
			Mut.dom.append(li, [" ", Mut.dom.elt("span", "☺", [["class", "pseudolink"], ["onclick", "Muib.showthumb(this, \""+item.thumbnail+"\")"]])]);
			return li;
		}
		function one_item_elt(eltname, item){
			var elt = Mut.dom.elt(eltname), label,
			link = get_ap_link(item, Miiif.a.id),
			ap = link[0], qv = link[1], uri = link[2];
			if(item[Miiif.a.type] === Miiif.v.collection) elt.className="collection";
			if(item.label){
				label = Mut.get_lang_text(item.label);
			}else{
				var path = uri.split("/");
				path.pop();
				label = path.pop();
			}
			if(uri){
				var link = Mut.dom.elt("a", label, [["href", ap + qv + uri]]);
				Mut.dom.append(elt, link);
			}else{
				Mut.dom.append(elt, label);
			}
			return elt;
		}
		function get_ap_link(item, idattr){
			var ap = "image-annotator",
			qv = "?" + (item.qpvar || "u") + "=",
			id = item[idattr] || item.id,
			uri = id ? Mut.resolve_uri(id) + 
			(item.qparam ?  "&" + item.qparam : "") +
			(item.fragment ? "#" + item.fragment : "") :
			"";
			return [ap, qv, uri];
		}
		function num_children(item){
			var c = item.manifests || item.collections || item.members;
			return c ? c.length : c;
		}
		function simple_table(def, pnode, mode){
			var tbl = Mut.dom.elt("table", "", [["class", "collection"]]),
			th = Mut.dom.elt("thead"),
			tr = Mut.dom.elt("tr"),
			dp = def["disp props"] ? def["disp props"].split(";") : null,
			alt = def["alternative"] || null,
			thp = ["Manifest w/ Image Annotator", "Description"];
			if(dp) thp = thp.concat(dp);
			thp.forEach(function(h){Mut.dom.append(tr, Mut.dom.elt("th", h));});
			th.appendChild(tr);
			tbl.appendChild(th);
			def.manifests.forEach(function (item){
				var tr = Mut.dom.elt("tr"), descr = Mut.dom.elt("td");
				if(item.description) descr.innerHTML = Mut.get_safe_text(item.description);
				if(mode==="-mv") item.qparam = (item.qparam ? item.qparam + "&" : "") + "moreviewer";
				var manlink = one_item_elt("td", item);
				if(item[alt]){
					var span = Mut.dom.elt("span", "", [["class", "alt"]]);
					Mut.dom.append(span, Mut.dom.elt("a", alt, [["href", (get_ap_link(item, alt)).join("")]]));
					Mut.dom.append(manlink, span);
				}
				Mut.dom.append(tr, [
					manlink,
					descr
				]);
				if(dp) dp.forEach(function(p){Mut.dom.append(tr, Mut.dom.elt("td", Mut.get_lang_text(item[p])));});
				tbl.appendChild(tr);
			})
			pnode.appendChild(tbl);
		}

	},
	collection_sate: {
		openlist: [],
		toScroll: null,
		set: function(fldrid, isopen){
			this.openlist[fldrid] = isopen;
			document.cookie = "coluri=" + Muib.opts.v.u;
			document.cookie = "openids=" + this.openlist.join(".");
			document.cookie = "path=" + location.pathname;
		},
		check: function(checkopen){
			var m = document.cookie.match(/coluri=([^;]+)/);
			if(m && m[1]===Muib.opts.v.u){
				m = document.cookie.match(/scrlpos=([^;]+)/);
				if(m && m[1]){
					this.toScroll = Number(m[1]);
				}
				if(!checkopen) return;
				m = document.cookie.match(/openids=([^;]+)/);
				if(m && m[1]){
					this.openlist = m[1].split(".");
					return this.openlist;
				}
				else return [];
			}else{
				document.cookie = "coluri=;max-age=0";
				return [];
			}
		},
		save_pos: function(){
			document.cookie = "coluri=" + Muib.opts.v.u;
			document.cookie = "scrlpos=" + document.body.scrollTop;
		}

	},
	
	proc_selections: function(def){
		this.use = true;
		var n = def.selections.length;
		var selres=[];
		var selcount = 0;
		var Cv_done = [];
		var lastman = null;
		var Anno = {};
		Muib.struct.data = [];
		Mia.ent.label = def.label;
		def.selections.forEach(function(sel, i){
			OpenSeadragon.makeAjaxRequest({
				"url": Mut.get_oneuri(sel.within),
				"success": function(xhr) {
					selres[i] = proc_selcv(Mpj.parse_json(xhr.response), sel);
				},
				"error": function(e){
					Muib.set_status("auto");
					Muib.main_msg("JSON file load error. "+ e.status+":"+e.statusText, "error");
					selres[i] = null;
				}
			});
		});
		test_done(n);
		
		function test_done(n){
			if(selres.length >= n){
				var tiles = [];
				selres.forEach(function(res){
					if(res){
						tiles = tiles.concat(res.tiles);
						Muib.struct.data.push(res.struct);
					}
				});
				Manno.keyuris = [];
				tiles.forEach(function(t){
					Mut.uniq_push(Manno.keyuris, Miiif.canvas.tilemap[t]);
				});
				if(Mia.ent.label) Muib.meta.add(def);
				else{
					Mpj.type = "Curation";
					Mia.ent.label = lastman.label;
					Mia.ent.description = lastman.description;
					Muib.meta.add(lastman);
				}
				Mia.init(tiles, Anno);
			}else if(selcount++ > 100){
				console.log("selection nest too much", selcount);
			}else{
				setTimeout(function(){test_done(n);}, 100);
			}
		}
		function proc_selcv(manifest, sel){
			lastman = manifest;
			var tg = [],
			res ={
				tiles: [],
				struct: null
			};
			if(sel.canvases) sel.canvases.forEach(function(c, i){register_canvas(c, i, tg, sel.label);});
			if(sel.members) sel.members.forEach(function(c, i){register_canvas(c, i, tg, sel.label);});
			Mut.get_first(manifest.sequences).canvases.forEach(function(cv){
				var id = cv[Miiif.a.id];
				if(Cv_done.indexOf(id) === -1 && tg.indexOf(id) >= 0){
					Miiif.canvas.proc(res.tiles, "images", cv);
					Cv_done.push(id);
				}
			}, this);
			res.struct = Muib.opts.v.raw ? sel : {
				"@type": "sc:Range",
				"@id": sel[Miiif.a.id],
				"label": sel.label,
				"canvases" : tg
			};
			
			return res;
		}
		function register_canvas(canv, i, tg, slabel){
			var tgid = Mut.get_oneuri(canv),
			bf = Mut.base_frag(tgid);
			if(bf[3] && !Muib.opts.v.raw){
				i++;
				if(slabel) slabel += " " + i;
				add_annotation(bf[0], bf[3], canv.label || slabel || "Curation " + i);
			}
			if(tg.indexOf(bf[0]) === -1) tg.push(bf[0]);
		}
		function add_annotation(base, frag, label){
			if(!Anno[base]) Anno[base] = [];
			Anno[base].push({
				"type" : "Annotation",
				"id": base+frag,
				"body": {"value": label},
				"target" : {
					"source" : base, 
					"selector" : {"value" : frag} 
				}
			});
		}
	},
	
	searchs: {
		elt: null,
		last_kwd: "",
		has_result: false,
		service_uri: null,
		reset_li: null,
		req: false,
		setup: function(s){
			Muib.opts.v.foc = false;
			var searchuri = s[Miiif.a.id],
			slabel = s.label || "search within content",
			form = Mut.dom.elt("form");
			this.service_uri = searchuri;
			form.addEventListener("submit",function(e){
				e.stopPropagation();
				e.preventDefault();
				Miiif.searchs.request(e.target.elements.kwd.value);
			},false);
			form.style.display = "inline-block";
			Mut.dom.append(form, [
				slabel + ": ",
				Mut.dom.elt("input","", [["type", "text"], ["name", "kwd"]]),
				Mut.dom.elt("input","", [["type", "submit"], ["value", "Search"]])
			]);
			Mut.dom.append(Muib.elt.jldctrl, form);
			this.reset_li = Mut.dom.elt("li", "reset search");
			this.reset_li.onclick = function(){Miiif.searchs.request("");};
		},
		request: function(kwd){
			var Keyword = kwd.toLowerCase();
			if(Keyword === ""){
				if(Manno.saved && Manno.saved.__orgl) reset_search();
			}else if(Keyword === this.last_kwd){
			}else if(Manno.saved && Manno.saved[Keyword]){
				save_current_anno();
				Manno.page = OpenSeadragon.extend(true, {}, Manno.saved[Keyword]);
				present_anno(false);
			}else{
				var oa = {};
				this.req = true;
				OpenSeadragon.makeAjaxRequest({
					"url": this.service_uri + "?q=" + kwd,
					"success": function(xhr) {
						Mpj.get_more_annot(xhr.response, oa, 1);
						save_current_anno();
						setup_anno(oa);
						present_anno(false);
					},
					"error": function(e){
						console.error(e);
					}
				});
			}
			return false;
			
			function present_anno(is_reset){
				Miiif.searchs.has_result = !is_reset;
				Miiif.searchs.req = false;
				setup_tindex(is_reset);
				Miiif.searchs.last_kwd = Keyword;
				Manno.clear_current();
				if(Manno.page[Mia.current.keyuri]) Manno.flush(Mia.current.keyuri);
				var add_remove = is_reset ? "remove" : "add";
				Muib.set_osdvclass("searchres", add_remove);
				Muib.set_objclass(Muib.elt.tindex, "searchres", add_remove);
				Muib.set_status("auto");
			}
			function save_current_anno(){
				if(! Manno.saved){
					Manno.saved = {"__orgl": OpenSeadragon.extend(true, {}, Manno.page)};
				}else if(!Manno.saved[Miiif.searchs.last_kwd]){
					Manno.saved[Miiif.searchs.last_kwd] = Manno.page;
				}
				Manno.page = {};
				Manno.total = 0;
			}
			function setup_anno(oa){
				var frags = {};
				for(var uri in oa) Manno.oa2annotorious(Manno.page, oa, uri, frags);
			}
			function setup_tindex(is_reset){
				Muib.elt.tindex.innerHTML = "";
				Muib.tindex.ppos.innerHTML = "";
				Muib.tindex.list = [];
				if(!Miiif.searchs.last_kwd){
					Miiif.searchs.saved_an = Muib.tindex.an;
					Muib.tindex.an = {"label": " occur", "pfx": "✑ "};
				}else if(is_reset){
					Muib.tindex.an = Miiif.searchs.saved_an;
				}
				if(is_reset){
					Muib.tindex.state.setdone = false;
					Muib.tindex.setup(Manno.page);
				} else gen_ul();
				Muib.tindex.update();
			}
			function gen_ul(){
				var ullist = Mut.dom.elt("ul"), li;
				if(Object.keys(Manno.page).length === 0) ullist.appendChild(Mut.dom.elt("li", "not found"));
				Manno.keyuris.forEach(function(uri, i){
					if((li = Muib.tindex.set_li(i, uri, Manno.page))){
						if(Manno.page[uri]) li.innerHTML += " ("+Manno.page[uri].length +")";
						else li.style.display = "none";
						ullist.appendChild(li);
						Muib.tindex.list.push(li);
					}
				});
				ullist.appendChild(Miiif.searchs.reset_li);
				Muib.tindex.anno_init_disp(1);
				Mut.dom.append(Muib.elt.tindex, [ullist, Muib.tindex.ppos]);
				Muib.annobox.searchres();
			}
			function reset_search(){
				save_current_anno();
				Manno.page = OpenSeadragon.extend(true, {}, Manno.saved.__orgl);
				Miiif.searchs.last_kwd = "";
				present_anno(true);
				Muib.annobox.btn.style.display = "inline";
			}
		}
	},
	
	proc_parent_json: function(indx){
		this.vers.set_prop(2);
		var pa = window.parent;
		var selection = pa.curation[indx];
		if(pa.p) Muib.opts.v.page = pa.p;
		Muib.opts.v.u = Mut.get_oneuri(selection.within);
		this.proc_selections({"selections": [selection]});
	},
	proc_ixif_media: function(def, tile, info){
		this.canvas.proc(tile, "elements", def.mediaSequences[0], info);
	}

};


var Muib = {
	elt : {},
	isTouchDev: (typeof window.ontouchstart) !== "undefined",
	env: {"rtl": false, "lang": null, flick_threshold: 2500}, 
	state: {"loadStart": false, "nvshown": false, "struct": false, "colthumb": null, dotimer: null, uribase: null, msg_count: 0}, 
	msg_log: [],

	set_h1: function (is_collection){
		var h1 = Mut.dom.get("h1")[0];
		if(!h1){
			h1 = Mut.dom.elt("h1");
			Muib.elt.maindiv.insertBefore(h1, Muib.elt.maindiv.firstChild);
		}
		Muib.set_objclass(document.body, (is_collection ? "collection" : "iaview"), "add");
		if(Mia.ent.label) {
			if(Muib.opts.v.inf){
				h1.innerHTML = Muib.meta.trim_text(Mia.ent.label, "mid", true);
				var p = window.parent;
				if(h1.firstChild.data === "Image Annotator"){
					p.document.title = Mia.ent.label;
				} else {
					p.document.title += " : " + Mia.ent.label + " - Image Annotator";
				}
			}else{
				h1.innerHTML = "";
				document.title = Mia.ent.label + " - Image Annotator";
				if(Mia.ent.logo){
					var logo = Mut.dom.elt("img", "", [["src", Mia.ent.logo]]);
					h1.appendChild(logo);
					Muib.style_set(logo, {"maxHeight": "38px", "float": "right", "marginLeft": "5px"}); 
				}
				h1.innerHTML += Muib.meta.fold_text(Mia.ent.label, "mid");
			}
		}else{
			if(Miiif.use && !Mia.current.is_error) console.warn("No label in manifest");
			if(Muib.opts.v.u) document.title += " : " + Mut.filename(Muib.opts.v.u);
		}
	},

	tindex: {
		list: [],
		ulinfo: {"e": null, "bcr": null, "cp": 0, "up": 0, "lp": 0},
		clicktg: null,
		strb: {"low": 5, "unused": 20, "mindiv": 30},
		single_canvas: {"minranges": 10, "skip": false},
		ppos: document.createElement("p"),
		maxl: {len: 0, text: ""},
		an: {label: " annot", pfx: "✍ "},
		state: {use: true, sidx: false, setdone: false, lastfrag: null},
		
		prepare: function (targetelt){
			if(
				Muib.opts.v.ti || 
				Muib.opts.v.inf ) this.state.use = false;
			if(this.state.use){
				Muib.elt.tindex = Mut.dom.elt("div", "", [["id", "titleidx"]]);
				Muib.elt.maindiv.insertBefore(Muib.elt.tindex, targetelt);

			}else if(Mia.current.type === "image"){
				Muib.elt.osdv.style.width = "100%";
				var metawidth = "100%";
				if(Muib.elt.dirinfo){
					Muib.elt.dirinfo.style.top = "auto";
					Muib.elt.dirinfo.style.bottom = "-1.5em";
					metawidth = "90%";
				}
				var mi = Mut.dom.get(".metainfo");
				for(var i=0,n=mi.length; i<n; i++){
					mi[i].style.width = metawidth;
				}
				if(Muib.opts.v.inf){
					var h = window.frameElement.clientHeight;
					Muib.elt.osdv.style.height = (h > 700 ? 700 : (h > 400 ? 450 : 360))+"px";
				}
			}
		},
		setup: function(annot){
			if(!this.state.use){
				if(Muib.opts.v.inf) this.each_tile(function(i, keyuri){
					var labelarr = Muib.tindex.set_tiledesc(i, keyuri);
					Muib.refstrip.set_titleattr(labelarr[1] || labelarr[0], i);
				}, this);
				return false;
			}
			if(this.state.setdone) return false;
			this.state.setdone = true;
			var ullist, tidx = Mut.dom.get("#titleidx");
			if(Muib.struct.data.length){
				ullist = Muib.struct.setup(annot);
				ullist.className = "struct";
			}else{
				ullist = Mut.dom.elt("ul");
				this.each_tile(function(i, keyuri, that){
					var li = that.set_li(i, keyuri, annot);
					if(li){
						ullist.appendChild(li);
						that.list.push(li);
					}
				}, this);
			}
			ullist.style.height = Muib.elt.osdv.clientHeight + "px";

			if(this.maxl.len <= Muib.meta.set_limit(this.maxl.text, "min") && Mia.current.type==="image"){
				Muib.set_osdvclass("sidx", "add");
				Muib.elt.tindex.className = "sidx";
				this.an.label = " annot";
				this.an.pfx = "";
				this.state.sidx = true;
			}
			Muib.elt.tindex.style.left = (Muib.elt.osdv.getBoundingClientRect().right + 10) + "px";
			this.anno_init_disp(1);
			Mut.dom.append(tidx, [ullist, this.ppos]);

			this.ulinfo.e = ullist;
			this.get_bcr();
			
		},
		each_tile: function(fn, that){
			for(var i=0,n=Manno.keyuris.length; i<n; i++){
				var keyuri = Manno.keyuris[i];
				fn(i, keyuri, that);
			}
		},
		get_bcr: function(){
			this.ulinfo.bcr = this.ulinfo.e.getBoundingClientRect();
			this.ulinfo.cp = this.ulinfo.bcr.top + Math.round(this.ulinfo.e.clientHeight/2);
			this.ulinfo.up = this.ulinfo.bcr.top + Math.round(this.ulinfo.e.clientHeight/8);
			this.ulinfo.lp = this.ulinfo.bcr.top + Math.round(this.ulinfo.e.clientHeight * 7/8);
		},
		anno_init_disp: function(inipos){
			Mut.dom.append(
				this.ppos, 
				inipos + " / " + Mia.ent.numTiles +" (" + 
				this.an.pfx + this.anno_disp()
			);
		},
		anno_disp: function (){
			return Manno.total + this.an.label + (Manno.total > 1 ? "s" : "")+")";
		},
		
		set_tiledesc: function (i, uri){
			if(!uri) return false;
			if(!Mia.cinfo[uri]) return [""];
			var clabel = Mia.cinfo[uri].label;
			if(clabel.match(/^\s*-\s*$/)) clabel = "";
			var label = clabel || Mia.cinfo[uri].description || "(#"+(i+1)+")",
			ttlattr = "", lim = Muib.meta.set_limit(label, "short");
			if(label.length >= lim){
				ttlattr = label.substr(0, 30);
				label = label.substr(0, lim-2)+"...";
			}
			if(!Mia.cinfo[uri].description) Mia.cinfo[uri].description = String(Mia.cinfo[uri].label);
			else if(Mia.cinfo[uri].label && !Mia.cinfo[uri].label.match(/^p\. \d+$/) && !Miiif.searchs.has_result) Mia.cinfo[uri].description = Mia.cinfo[uri].label + ": " + Mia.cinfo[uri].description;
			if(!Miiif.searchs.has_result) Mia.cinfo[uri].need_dimcheck = Miiif.use;
			return [label, ttlattr];
		},
		set_li: function (i, keyuri, annot){
			var labelarr = this.set_tiledesc(i, keyuri);
			if(labelarr === false) return false;
			var imginfo = Mia.cinfo[keyuri],
			numannot = annot[keyuri] ? annot[keyuri].length : 
				((imginfo && imginfo.other && !Miiif.searchs.has_result) ? 1 : 0);
			var li = Mut.dom.elt("li");
			var pos = i === "" ? "" : (i < 0 ? -i : Muib.tindex.get_pos(i));
			li.setAttribute("data-p", pos);
			li.setAttribute("data-i", i);
			if(numannot){
				li.setAttribute("data-an", numannot);
				Manno.total += numannot;
			}
			if(imginfo && imginfo.layer) li.setAttribute("data-ovl", imginfo.layer.length);
			this.set_li_hander(li);
			Mut.dom.append(li, labelarr[0]);
			if(labelarr[1]) li.setAttribute("title", labelarr[1]);
			if(Muib.refstrip.vrs) Muib.refstrip.set_titleattr(labelarr[1] || labelarr[0], i);
			return li;
		
		},
		set_li_hander: function(li){
			li.onclick = function(ev){
				ev.ctrlKey ? Muib.tindex.showinfo(this) : Muib.tindex.lup(this);
			};
			li.onmouseenter = function(ev){
				if(ev.ctrlKey) Muib.tindex.showinfo(this, true);
			};
			li.onmouseout = function(){
				Muib.set_status("loadcheck");
			};
		},
		lup: function(tg){
			Muib.tindex.clicktg = tg;
			if(Mav.type){
				var midx = tg.getAttribute("data-p"),
				dfrag = tg.getAttribute("data-frag"),
				mf = dfrag ? dfrag.match(/t=(\d+)/) : null,
				st = mf === null ? 0 : mf[1],
				prevuri = Manno.key_uri();
				if(Mav.multicv){
					if(tg.className !== "current"){
						Mav.set_newpage(Manno.keyuris[midx], prevuri, true, st);
						Muib.tindex.set_current_li();
					}
					return;
				}else 
				if(Miiif.max_cvmedia === 1){
					if(midx !== "" && Mav.muris[midx] !== Mav.vinfo.url){
						Mav.vinfo.url = Mav.muris[midx];
						Mav.v.src = Mav.muris[midx];
					}
					Mav.state.lastsec = st - 1;
					Mav.v.currentTime = st;
					Mav.v.play();
					if(Mav.cvurl !== Miiif.map[Mav.vinfo.url]) Mav.set_newpage(Miiif.map[Mav.vinfo.url], true);
				}else{
					if(tg.className !== "current"){
						Mav.annot.check_now(st);
						Muib.tindex.set_current_li();
					}
				}
			}else if(Mia.current.pos !== Number(tg.getAttribute("data-i"))){
				Muib.set_status("load");
				tg.className = "loading";
				var tgpos = Number(tg.getAttribute("data-p"));
				Mia.current.loading = Mut.set_fileaction_info("for", Manno.keyuris[tgpos]);
				Muib.main_msg("request " + Mia.current.loading[0] + "...", "normal");
				viewer.goToPage(tgpos);
				Muib.tindex.test_canvas_frag(tg);

			}else if(tg.className !== "current"){
				Muib.tindex.set_current_li();
			}
			Muib.state.msg_count = 0;
		},
		showinfo: function(tg){
			var i = tg.getAttribute("data-i"), 
			p = tg.getAttribute("data-p"), plabel, imgurl, keyuri;
			if(i==="") return;
			if(Mav.type){
				keyuri = Manno.keyuris[p];
				plabel = "mediauri";
				imgurl= Mia.cinfo[keyuri].mediaurl;
			}else{
				keyuri = Manno.keyuris[i];
				plabel = "tile";
				imgurl= Mia.cinfo[keyuri].imgurl;
			}
			var info = [
				"i (source): " + i,
				"p ("+plabel+"): " + p,
				"current pos: " + Mia.current.pos,
				"keyuri: " + keyuri.split("/").slice(-2).join("/"),
				"mediaurl: " + (imgurl ? imgurl.split("/").slice(-5).join("/") : "same as keyuri")
			];
			alert(info.join("\n")); 
		},
		update: function(prevuri){
			if(!this.state.use){
				Mia.current.pos = this.get_pos(viewer.currentPage());
			}else if(this.list.length > 1){
				this.set_current_li();
				var newpage = (Mia.current.pos + 1);
				if(prevuri){
					if(newpage === 1)  location.replace("#");
					else location.replace("#p" + newpage);
				}
				this.ppos.innerHTML = this.ppos.innerHTML.replace(/^\d+ \/ /, newpage + " / ");
				var lir = this.list[Mia.current.pos].getBoundingClientRect();
				if(lir.top <= this.ulinfo.bcr.top){
					if(lir.top > this.ulinfo.bcr.top-60) this.ulinfo.e.scrollTop += (lir.top - this.ulinfo.up);
					else this.ulinfo.e.scrollTop += (lir.top - this.ulinfo.cp);
				}else if(lir.bottom >= this.ulinfo.bcr.bottom){
					if(lir.top < this.ulinfo.bcr.bottom+60) this.ulinfo.e.scrollTop += (lir.top - this.ulinfo.lp);
					else this.ulinfo.e.scrollTop += (lir.top - this.ulinfo.cp);
				}
			}
		},
		set_current_li: function(pos){
			if(Mia.current.lielt) Mia.current.lielt.className = "";
			if(!pos) pos = this.get_pos(viewer.currentPage());
			Mia.current.pos = pos;
			var posli = this.list[Mia.current.pos];
			Mia.current.lielt = this.clicktg || posli;
			Mia.current.lielt.className = "current";
			if(! this.clicktg){
				if(Muib.state.struct) this.open_toggler(Mia.current.lielt);
			}else{
				this.clicktg = null;
			}
			this.test_canvas_frag(Mia.current.lielt);
		},
		open_toggler: function(node){
			while((node = (node.parentNode ? node.parentNode.parentNode : null))){
				if(! node.className || ! node.className.match(/^range/)) break;
				if(node.firstChild.className === "opener") Muib.toggle(node.firstChild, true);
			}
		},
		get_pos: function(pos){
			return Muib.env.rtl ? Mia.ent.numTiles - pos - 1 : pos;
		},
		set_data_an_attr: function(count){
			if(this.list.length === 0) return;
			var li = this.list[Mia.current.pos];
			if(count === 0){
				if(li.getAttribute("data-an")) li.removeAttribute("data-an");
			}else{
				li.setAttribute("data-an", count);
			}
		},
		test_canvas_frag: function(tg){
			var df = tg.getAttribute("data-frag");
			if(df && df.match(/^xywh/)){
				var p = tg.parentNode.parentNode,
				tgli = p.tagName === "li" ? p.firstChild : tg;
				Manno.pseudo_anno(
					tgli.innerText,
					df,
					Manno.keyuris[tg.getAttribute("data-i")]
				);
				this.lastfrag = df;
			}else if(this.lastfrag){
				if(Manno.temp){
					anno.removeAnnotation(Manno.temp);
					Manno.temp = null;
					Manno.hilite_annoclip(false);
				}
			}
		}
	},
	
	struct: {
		data: [],
		ullist: null,
		lis: {},
		used: [],
		unused: {},
		cloned: {},
		uri_label: {},
		r_map: {},
		r_ul: {},
		registered: {},
		ONE_CANVAS_ONLY: 1,
		ONE_CANVAS_AND_MORE: 2,
		NOT_SINGLE: 0,
		NO_SKIP: 0,
		skip_single_canvas: false,
		reslabel: ["NOT_SINGLE", "ONE_CANVAS_ONLY", "ONE_CANVAS_AND_MORE"],
		
		setup: function(annot){
			if(!Mav.type && !Mia.current.is_error) Muib.main_msg("proc structure...");
			Muib.state.struct = true;
			this.ullist = Mut.dom.elt("ul");
			for(var i=0,n=Manno.keyuris.length; i<n ; i++){
				var keyuri = Manno.keyuris[i];
				var li = Muib.tindex.set_li(i, keyuri, annot);
				if(li){
					this.lis[keyuri] = li;
					this.unused[keyuri] = true;
				}else{
				}
			}
			Muib.tindex.list = Object.values(this.lis);
			this.skip_single_canvas = (Muib.struct.data.length > Muib.tindex.single_canvas.minranges) ? true : Muib.tindex.single_canvas.skip; 
			this.data.forEach(function(r){
				var label = Mut.get_lang_text(r.label);
				Mia.set_maxlabel(label);
				var el = this.prep_elt(label, true, r.viewingHint);
				var is_single = this.test_single(r),
				rsid = r[Miiif.a.id];
				if(r.ranges) this.proc_ranges(el, r.ranges, rsid);
				if(r.canvases) this.proc_canvases(el, r.canvases, rsid, label, is_single);
				if(r.members) this.proc_members(el, r.members, rsid, is_single);
				this.register(el, rsid);
			}, this);
			var hint, add_cond = this.calc_add_unused_cond(), ulfc = this.ullist.firstChild, ulcn;
			if(ulfc && (hint = ulfc.getAttribute("data-hint")) && hint === "top"){
				this.ullist = ulfc.childNodes[1];
				ulfc = this.ullist.firstChild;
			}
			if(this.ullist.childNodes.length === 1 &&
				ulfc.childNodes[1] && 
				ulfc.childNodes[1].childNodes.length && !add_cond){
				this.ullist = ulfc.childNodes[1];
			}
			if(add_cond && hint !== "top" && Mia.current.type === "image") this.add_unused(true);
			if(Muib.opts.v.page) this.open_branch(hint);
			return  this.ullist;
		},
		
		proc_ranges: function(elm, ranges, rsid){
			this.r_ul[rsid] = elm.ul;
			ranges.forEach(function(rdid){
				this.r_map[rdid] = rsid;
			}, this); 
		},
		proc_canvases: function(elm, canvases, rsid, label, is_single){
			if(is_single === this.ONE_CANVAS_ONLY){
				this.one_canvas(elm, canvases[0], label, is_single, false);
			}else{
				if(is_single === this.ONE_CANVAS_AND_MORE){
					if(this.r_map[canvases[0]]){
						return;
					}
					elm.ul.setAttribute("data-dcuri", canvases[0]);
				}
				canvases.forEach(function(cvid, i){
					this.r_map[cvid] = rsid;
					elm.ul.appendChild(this.one_leaf(cvid, "", false));
				}, this);
			}
		},
		proc_members: function(elm, members, rsid, is_single){
			members.forEach(function(rm, i){
				var membid = rm[Miiif.a.id] || rsid + "-" + i;
				var label = Mut.get_lang_text(rm.label);
				this.r_map[membid] = rsid;
				if(this.is_leaf(rm)){
					if(is_single === this.ONE_CANVAS_ONLY){
						this.one_canvas(elm, membid, label, is_single, true);
					}else{
						var li = this.one_leaf(membid, label, true);
						if(li){
							elm.ul.appendChild(li);
						}
					}
				}else{
					var status, newset;
					if(!this.r_ul[rsid])
						this.r_ul[rsid] = elm.ul;
					if(rm.members) {
						var elmm = this.prep_elt(label, true);
						this.proc_members(elmm, rm.members, membid, this.test_single(rm));
					}else{
					}
				}
			}, this);
			this.register(elm, rsid);
		},
		one_leaf: function(uri, label, is_membr){
			var frag;
			if(uri.match(/^(.*)#(.*)$/)){
				uri = RegExp.$1;
				var f = RegExp.$2.match(/^(xywh|t)(=.*)$/);
				if(f){
					frag = f[0];
				}else{
					frag = "";
				}
			}
			var li = this.use(uri, frag, is_membr);
			if(li){
				if(label) li.innerText = label;
				if(li.innerText === ""){
					if(Mav.type) return false;
					else li.innerText = frag ? "(" + frag + ")" : "--";
				}
				Mut.prepare_obj(this.uri_label, uri);
				Mut.countup(this.uri_label[uri], li.innerText);
				if(frag){
					if(this.uri_label[uri] && this.uri_label[uri][li.innerText] > 1)
					li.innerText += " (" + this.uri_label[uri][li.innerText] + ")";
				}
			}
			return li;
		},
		one_canvas: function(elmoc, uri, label, is_single, is_membr){
			if(is_single && !label) label = elmoc.label;
			elmoc.pli = this.one_leaf(uri, label, is_membr);
			elmoc.ul = null;
		},

		use: function(uri, frag, is_membr){
			var uidx = this.used.indexOf(uri);
			if(uidx >=0 || frag || is_membr){
				var li;
				if(this.lis[uri]){
					li = this.lis[uri].cloneNode(true);
					li.setAttribute("data-uri", uri);
					Muib.tindex.set_li_hander(li);
					if(frag || is_membr) this.cloned[uri] = li;
					if(frag) li.setAttribute("data-frag", frag);
				}else{
					var upos = this.find_media_idx(uri);
					li = Muib.tindex.set_li((upos === -1 ? "" : -upos), uri, {});
					if(li && frag) li.setAttribute("data-frag", frag);
				}
				if(uidx === -1){
					this.used.push(uri);
					if(this.unused[uri]) delete this.unused[uri];
				}
				return li;
			}else if(!this.lis[uri]){
				return Mut.dom.elt("li", "Unknown " + Mut.disp_uri(uri));
			}else{
				this.used.push(uri);
				delete this.unused[uri];
				if(this.cloned[uri]) delete this.cloned[uri];
				return this.lis[uri];
			}
		},
		find_media_idx: function(uri){
			if(!Mav.type) return -1;
			var pos = Manno.keyuris.indexOf(uri);
			if(pos === -1){
				pos =  Manno.keyuris.indexOf(uri.match(/^https:/) ? uri.replace(/^https:/, "http:") : uri.replace(/^http:/, "https:"));
				if(pos > -1) console.log("different scheme");
			}
			return pos;
		},
		prep_elt: function(label, is_opener, hint){
			var pli = Mut.dom.elt("li");
			var ul = Mut.dom.elt("ul");
			var toggler = Mut.dom.elt("span", label);
			Mut.dom.append(pli, toggler);
			pli.className = "range" + (is_opener ? "" : " openf");
			if(hint) pli.setAttribute("data-hint", hint);
			toggler.className = is_opener ? "opener" : "closer";
			toggler.onclick = function(){Muib.toggle(this, true);};
			return {"pli": pli, "ul": ul, "label": label};
		},
		register: function(elm, id){
			if(elm.ul) elm.pli.appendChild(elm.ul);
			if(!elm.ul && this.r_ul[id]){
				elm.pli.appendChild(this.r_ul[id]);
			}
			if(this.r_map[id]){
				var rul;
				if((rul = this.r_ul[this.r_map[id]]) && elm.pli){
					var dcand = rul.getAttribute("data-dcuri"), duri;
					if(dcand){
						if((duri = elm.pli.getAttribute("data-uri")) &&
							duri === dcand &&
							rul.firstChild === this.lis[dcand]
						){
							rul.removeChild(rul.firstChild);
							rul.removeAttribute("data-dcuri");
							elm.pli.removeAttribute("data-uri");
							console.log("duplicate canvas li omitted", Mut.filesignat(dcand));
						}
					}
					rul.appendChild(elm.pli);
					this.registered[id] = this.r_map[id];
					delete this.r_map[id];
				}else console.log("no this.r_ul or pli for", this.r_map[id], this.r_ul[this.r_map[id]], elm.pli);
			}else{
				if(this.registered[id]){
				}else{
					this.ullist.appendChild(elm.pli);
					this.registered[id] ="top";
				}
			}
		},
		is_leaf: function(node){
			return Miiif.get_type(node) === "Canvas";
		},
		test_single: function(r){
			var count = {ranges:0, canvases:0};
			["ranges","canvases"].forEach(function(p){
				count[p] = (r[p] ? r[p].length : 0);
			});
			if(r.members) r.members.forEach(function(m){
				if(this.is_leaf(m)) count.canvases++;
				else count.ranges++;
			}, this);
			return count.canvases === 1 ? (
				count.ranges === 0 ? this.ONE_CANVAS_ONLY:
				this.ONE_CANVAS_AND_MORE) : this.NOT_SINGLE;
		},
		calc_add_unused_cond: function(){
			var usecount = this.used.length + Object.keys(this.cloned).length;
			return (
				usecount < Muib.tindex.list.length / Muib.tindex.strb.mindiv || 
				(usecount < Muib.tindex.strb.low && Object.keys(this.unused).length > Muib.tindex.strb.unused)
			);
		},
		add_unused: function(is_closed){
			var el = this.prep_elt("[more]", is_closed);
			for(var uri in this.unused){
				if(this.cloned[uri]) ;
				else el.ul.appendChild(this.lis[uri]);
				delete this.unused[uri];
			}
			el.pli.appendChild(el.ul);
			this.ullist.appendChild(el.pli);
		},
		check_unregistered: function(){
			console.log("unregistered", this.r_map);
		},
		open_branch: function(hint){
			var uri = Object.keys(this.lis)[Muib.opts.v.page - 1];
			if(this.unused[uri] && !this.cloned[uri]){
				if(Mia.current.type === "image" && hint !== "top") this.add_unused(false);
			}else{
				var node = this.lis[uri];
				if(!node.parentNode && this.cloned[uri]) node = this.cloned[uri];
				while((node = node.parentNode.parentNode)){
					if(node.className === "range"){
						node.className += " openf";
						node.firstChild.className = "closer";
					}
				}
			}
		}
	},
	meta: {
		lang: {watch: false, opts: {}, selector: "", selected: ""},
		added: false,
		div: {
			"meta": {id: "metap", label: "metadata", m: {}, count:0, show: false},
			"link": {id: "linkp", label: "link properties", m: {}, count:0, show: false}
		},
		linkp : {"seeAlso": "See also", "related": "Related", "rendering": "Rendering", "within": "Within"},
		temp: {"meta": {}, "link": {}}, 
		nump: 0,
		add: function (def){
			this.lang.watch = true;
			var pa, pid = "docdsc", metadiv;
			if((pa = Mut.dom.get(pid, "id"))){
				Muib.elt.maindiv.removeChild(pa);
				pa.innerHTML = "";
			}else{
				pa = Mut.dom.elt("div", "", [["class", "metainfo"], ["id", pid]]);
			}
			for(var key in this.div){
				if(this.temp[key].m){
					this.div[key].count += this.temp[key].count;
					Object.assign(this.div[key].m, this.temp[key].m);
				}
			}
			Muib.elt.docmeta = pa;
			this.added = this.generate(def, pa);
			Muib.elt.maindiv.appendChild(pa);
			for(var key in this.div){
				if(this.div[key].show && (metadiv = Mut.dom.get(this.div[key].id, "id"))) Muib.toggle(metadiv.firstChild);
			}
			this.lang.watch = false;
		},
		reset_lang: function(lang){
			Mut.preflang = this.lang.selected = lang;
			var Mdiv = {};
			proc_mdiv(this, "record");
			Mpj.set_ent_meta(Mia.jsource);
			Muib.set_h1(false);
			Muib.elt.docmeta.innerHTML = "";
			this.generate(Mia.jsource, Muib.elt.docmeta);
			proc_mdiv(this, "restore");
			function proc_mdiv(that, what){
				for(var key in that.div){
					if(!Mdiv[key]) Mdiv[key] = {};
					Mdiv[key].elt = Mut.dom.get(that.div[key].id, "id");
					if(Mdiv[key].elt){
						if(what === "record"){
							Mdiv[key].expander = Mdiv[key].elt.firstChild.className;
						}else{
							if(Mdiv[key].expander === "closer")
							Muib.toggle(Mdiv[key].elt.firstChild);
						}
					}
				}
			}
		},
		generate: function(def, pa){
			var links = "", more = "", ShowMeta = false;
			this.nump = 0;
			for(var key in this.temp) this.temp[key] = {m: {}, count:0};

			if(Mia.ent.description){
				links = this.mlist("Description", this.fold_text(Mia.ent.description));
				this.nump++;
			}
			if(def.logo) Mia.ent.logo = def.logo[Miiif.a.id] || def.logo;
			links += gen_text_li(def.attribution, "Attribution", this);
			links += this.set_objlink(def.rights, "Rights");
			links += this.set_objlink(def.license, "License");
			links += this.set_objlink(def["rdfs:seeAlso"], "See also");
			if(Miiif.use){
				var dl = this.set_linkprops(def),
				seq = Miiif.usedSeq;
				if(!dl && seq) dl = this.set_linkprops(seq);
				if(dl) more = gen_togglerdl(dl, this.div.link, this);
				dl = this.set_metalink(def.metadata);
				if(!dl && seq && seq.metadata) dl = this.set_metalink(seq.metadata);
				if(dl) more += gen_togglerdl(dl, this.div.meta, this);
				
				
			}
			if(Muib.opts.v.inf) Mut.dom.append(Muib.elt.maindiv, 
				Mut.dom.ashtml(this.set_toggler(" ", "Show document info")).firstChild
			);
			var lang_selector = this.lang.selector || setup_selector(this);
			pa.innerHTML = "<em>Document info <a href=\""+ Muib.opts.v.u + 
			"\">" + Mpj.type.toLowerCase() + "</a></em>" + lang_selector + ":";
			pa.innerHTML += (links ? "<dl>" + links + "</dl>" : "") + more;
			return links ? true : false;

			function gen_togglerdl(dl, div, that){
				return "<div id=\"" + div.id +"\">" + 
				that.set_toggler((div.show ? "" : "show ") + div.label, "") +
				"<dl class=\"more\">\n" + dl + "</dl>\n</div>\n";
			}
			function set_attribution(text, that){
				var mlabel, more = Mia.ent.logo ? 
				" <img src=\"" + Mia.ent.logo + "\" class=\"logo\"/>" : "";
				if((mlabel = text ? "Attribution" : (more ? "Logo" : null))){
					return gen_text_li(text, mlabel, that, more);
				}else{
					return "";
				}
			}
			function gen_text_li(text, mlabel, that, more){
				if(!text) return "";
				that.nump++;
				return that.mlist(
					mlabel, 
					Muib.meta.fold_text(Mut.get_safe_text(text)) + (more || "")
				);
			}
			function setup_selector(that){
				var langopts = Object.keys(that.lang.opts);
				if(langopts.length < 2) return "";
				var selector = " <select onchange=\"Muib.meta.reset_lang(this.options[this.selectedIndex].value);\">";
				langopts.forEach(function(lng){
					selector += "<option" + (lng === that.lang.selected ? " selected>" : ">") + lng + "</option>";
				});
				return selector + "</select>";
			}
		},
		set_linkprops: function (def){
			var more = {}, count = 0, link = "";
			for(var prop in this.linkp) count += this.set_val_data(this.temp.link.m, def[prop], this.linkp[prop]);
			count += this.test_service(this.temp.link.m, def.service);
			if(count === 0) return "";
			this.temp.link.count += count;
			this.nump += count;
			link += this.gen_dtdd(this.temp.link.m, this.div.link.m);
			this.div.link.show = (count > 2 && this.nump > 5) ? false : true;
			return link;
		},
		set_metalink: function (obj){
			if(!obj && this.div.meta.count === 0) return "";
			var dl = this.set_metalist(obj, this.temp.meta, this.div.meta.m);
			if(this.temp.meta.count < 3 || this.nump + this.temp.meta.count < 6) this.div.meta.show = true;
			return dl;
		},
		set_metalist: function(obj, tg, saved){
			var val;
			if(!tg) tg = {m:{}, count:0};
			for(var p in obj){
				if((val = Mut.text_or_link(Mut.get_safe_text(obj[p].value)))){
					tg.count++;
					var label = Mut.get_lang_text(obj[p].label) || "(anon)";
					if(!tg.m[label]) tg.m[label] = [];
					tg.m[label].push(val);
				}
			}
			return this.gen_dtdd(tg.m, saved);
		},
		gen_dtdd: function(meta, saved){
			var dl = "";
			if(Object.keys(meta).length) for(var prop in meta){
				dl += this.mlist(prop, meta[prop].join("</dd><dd>"));
			}
			if(saved && Object.keys(saved).length) for(var prop in saved){
				dl += this.mlist(prop, saved[prop].join("</dd><dd>"));
			}
			return dl;
		},
		mlist: function(label, val){
			return "<div><dt>" + label + "</dt><dd>" + val + "</dd></div>\n";
		},
		lilist: function(label, val){
			return "<li><strong>" + label + "</strong>: " + val + "</li>\n";
		},
		set_val_data: function(metaar, obj, label){
			if(! obj) return 0;
			var val, res = [];
			if(! (obj instanceof Array)) obj = [obj];
			obj.forEach(function(o){
				if((val = this.get_text_link(o))){
					res.push(val);
				}
			}, this);
			if(res.length) metaar[label] = res;
			return res.length;
		},
		set_objlink: function(obj, label){
			if(!obj) return "";
			var metaar = {};
			this.set_val_data(metaar, obj, label);
			return this.gen_dtdd(metaar);;
		},
		get_text_link: function(obj, useformat){
			var link, text;
			if(typeof(obj) === "object"){
				link = obj.id || obj[Miiif.a.id];
				text = Mut.get_safe_text(obj.label);
				if(useformat && obj.format) text += " (" + obj.format + ")";
			}else{
				link = obj;
			}
			return text ? Mut.gen_anchor(link, text) : Mut.text_or_link(link);
		},
		fold_text: function (text, type){
			var limit = this.set_limit(text, type || "long");
			var thld = limit - 6;
			var notag = text.replace(/<.*?>/g, "");
			if(notag.length > limit){
				return notag.substr(0, thld) + "<span class=\"more\">" +
				notag.substr(thld) + "</span><span class=\"expander\" " +
				"onclick=\"Muib.expand(this);\">...(more)</span>";
			}else{
				return text;
			}
		},
		trim_text: function (text, type, to_half){
			var limit = this.set_limit(text, type || "long");
			if(to_half) limit = Math.round(limit / 2);
			var thld = limit - 3;
			if(text.length > limit){
				return text.substr(0, thld) + "...";
			}else{
				return text;
			}
		},
		set_limit: function(str, type){
			return [
				{"min": 14, "short": 22, "mid": 64, "long": 260, "xlong": 500},
				{"min": 10, "short": 14, "mid": 50, "long": 140, "xlong": 280}
			][String(str).match(/^✍?[\x20-\x7E\xC0-\xFC]{8}/) ? 0 : 1][type]; 
		},
		set_toggler: function(label, ttlattr){
			if(ttlattr) ttlattr = " title=\"" + ttlattr + "\"";
			return "<span" + ttlattr + " class=\"opener\" onclick=\"Muib.toggle(this);\">" + label + "</span>";
		},
		set_more_prop: function(def){
			var dl = "";
			for(var prop in this.linkp){
				if(def[prop] && !this.temp.link.m[prop]){
					this.set_val_data(this.temp.link.m, def[prop], prop);
					dl += this.mlist(this.linkp[prop], this.temp.link.m[prop]);
				}
			}
			if(dl) Mut.dom.select("#linkp dl").innerHTML += dl;
		},
		test_service: function(more, sv){
			if(!sv) return 0;
			if(!(sv instanceof Array)) sv = [sv];
			more["Service"] = [];
			var searchapipat = new RegExp(Mpj.ctxs.iiif_s + "[\\d\\.]+/search$");
			sv.forEach(function(s){
				var val = Mut.get_safe_string(s[Miiif.a.id] || s);
				if(s.profile && s.profile.match(searchapipat)){
					Miiif.searchs.setup(s);
					val += " (Search API. See query box↑)";
				}
				more["Service"].push(val);
			});
			return sv.length;
		}
	},

	prep_folder: function(label, is_opener, checker){
		var pli = Mut.dom.elt("li");
		var toggler = Mut.dom.elt("span", label);
		Mut.dom.append(pli, toggler);
		pli.className = "range" + (is_opener ? "" : " openf");
		toggler.className = is_opener ? "opener" : "closer";
		toggler.onclick = function(){Muib.toggle(this, checker);};
		return pli;
	},
	expand: function (o){
		if(o.firstChild.data === " (less)"){
			o.previousSibling.style.display = "none";
			o.firstChild.data = "...(more)";
		}else{
			o.previousSibling.style.display = "inline";
			o.firstChild.data = " (less)";
		}
	},
	toggle: function (o, checker){
		var tg = o.nextSibling;
		if(typeof(checker) === "string"){
			do{
				if(tg.nodeType === 1 && tg.nodeName.toLowerCase() === checker) break;
				tg = tg.nextSibling;
			}while(tg)
		}
		if(o.className === "opener"){
			tg.style.display = "block";
			o.innerText = o.innerText.replace(/^more/, "less");//▹▿
			o.innerText = o.innerText.replace(/^show/, "hide");
			o.className = "closer";
		}else{
			tg.style.display = "none";
			o.innerText = o.innerText.replace(/^less/, "more");
			o.innerText = o.innerText.replace(/^hide/, "show");
			o.className = "opener";
		}
		if(checker===true) this.tindex.get_bcr();
		var fid;
		if((fid = o.parentNode.getAttribute("data-fldr")))
		Miiif.collection_sate.set(fid, (o.className === "closer"));
	},
	
	main_msg: function (msg, cls){
		if(cls) setup_class(cls, this);
		if(msg === "") return;
		this.elt.msg.innerHTML = msg.replace(/\.\.\.$/, "<img src=\"/parts/loading-c.gif\"/>");
		if(msg.substr(0, 4) === "done"){
			if(this.state.msg_count++ > 50){
				if(e) console.log(e);
				this.state.msg_count = 0;
				throw "too many done message";
			}
			setup_class("normal", this);
			if(this.elt.msg.style.opacity > 0){ // === "1"
				this.fadeio(this.elt.msg, 1000, 1);
				this.msg_log = Mut.array_circular(this.msg_log, msg, 30, 20);
				this.set_status("auto");
			}
		}else{
			this.elt.msg.style.opacity = cls === "error" ? 1 : 0.8;
			if(cls === false) msg = "message displayed";
			this.msg_log = Mut.array_circular(this.msg_log, msg, 30, 20);
			if(cls === "normal") this.set_status("auto");
		}
		function setup_class(cls, that){
			that.elt.msg.className = (cls === "normal") ? "msg" : "msg " + cls;
		}
	},
	set_status: function (status){
		if(status === "wait"){
			this.set_bclass("wait", "add");
		}else if(status === "load"){
			this.state.loadStart = true;
		}else if(status === "loadcheck" && this.state.loadStart){
			this.set_bclass("wait", "add");
			this.state.loadStart = false;
		}else if(status === "auto"){
			this.set_bclass("wait", "remove");
			this.state.loadStart = false;
		}
	},
	set_bclass: function(status, add_remove){
		this.set_objclass(document.documentElement, status, add_remove);
	},
	set_osdvclass: function(cname, add_remove){
		this.set_objclass(Muib.elt.osdv, cname, add_remove);
	},
	set_objclass: function(obj, cname, add_remove){
		var cnamepat = new RegExp("\\b" + cname);
		if(add_remove === "add"){
			if(!obj.className) obj.className = cname;
			else if(!obj.className.match(cnamepat)) obj.className += " " + cname;
		}else if(add_remove === "remove"){
			obj.className = obj.className.replace(cnamepat, "");
		}
	},
	refstrip: {
		vrs: null,
		vertical: false,
		init: function(){
			this.vrs = viewer.referenceStrip;
		},
		setup: function(){
			if(!this.vrs) return;
			Muib.elt.refstr = this.vrs.element;
			Muib.elt.refstr_p = Muib.elt.refstr.parentNode;
			if(Muib.opts.osdbr === "mk"){
				Muib.elt.refstr_p.className = "refstrp" + (this.vertical ? " rtl" : "");
				Muib.elt.refstr_p.onscroll = function(e){
					Muib.do_after(100, function(){Muib.refstrip.set_current(e);});
				};
			}
			this.vrs.panelWidth = Mia.const.refspw;
			if(Muib.opts.v.showReferenceStrip === false){
				Muib.elt.refstr.parentNode.parentNode.style.display = "none";
			}
			if(Muib.opts.v.inf){
				Muib.elt.refstr_p.parentNode.style.width = "100%";
				Muib.elt.refstr_p.style.width = "100%";
			}
			if(this.vertical){
				var refpp = Muib.elt.refstr_p.parentNode;
				refpp.insertBefore(Muib.elt.refstr_p, refpp.firstChild);
			}else{
				Muib.elt.refstr.style.width = this.vrs.panels.length * (this.vrs.panelWidth + 3) + "px";
			}

			this.vrs.currentSelected.style.background = 
				this.vrs.selectedBg = Muib.opts.v.refstripbg;
			this.vrs.setFocus(Muib.opts.iniOsdPos);
			
		},
		set_titleattr: function(label, pos){
			if(typeof(pos)==="number" && pos >= 0){
				this.vrs.panels[this.get_pos(pos)].
				setAttribute("title", label);
			}
		},
		
		set_current: function(e){
			this.vrs._loadPanels(e.target.scrollLeft);
		},
		get_pos: function(pos){
			return Muib.tindex.get_pos(pos);
		}
	},

	jld: {
		showbtn: function (action){
			if(!Muib.elt.jldb) return false;
			if(action === "selector"){
				if(Muib.isTouchDev) Muib.elt.jldb.firstChild.data = "Close selector";
				Muib.elt.jldb.style.display = "inline";
			}else if(action){
				Muib.elt.jldb.firstChild.data = action + " JSON-LD";
			}else{
				Muib.elt.jldb.style.display = "inline";
				if(!Miiif.searchs.has_result)
				Muib.annobox.btn.style.display = "inline";
			}
		},
		toggle: function (o, id){
			var jldarea = Muib.elt.jldarea;
			var btn = o ? o : Mut.dom.get(id, "id");
			var label = btn.firstChild;
			if(label.data.substr(0, 5) === "Close"){
				Mwa.cancel_anno_selector();
				label.data =  "Show JSON-LD";
			}else if(label.data.substr(0, 4) === "Show"){
				var as_page_chbx = {"checked": false};
				jldarea.value = JSON.stringify(Manno.get_annotation(as_page_chbx), null, 4);
				jldarea.style.display = "block";
				label.data = "Hide JSON-LD";
				Mwa.cancel_anno_selector();
			}else{
				jldarea.style.display = "none";
				label.data =  "Show JSON-LD";
			}
		}
	},
	annobox: {
		btn: null,
		btname: "Annotation",
		show: true,
		pendingUri: null,
		init_elt: function(jldctrl){
			this.btn = Mut.dom.elt("button", "Hide " + this.btname);
			this.btn.onclick = function(){Muib.annobox.toggle();};
			this.btn.style.display = "none";
			Mut.dom.append(jldctrl, [" ", this.btn]);
		},
		toggle: function (){
			var label = this.btn.firstChild;
			if(this.pendingUri){
				Miiif.add_other_content(this.pendingUri);
				label.data = "Hide " + this.btname;
				this.show = true;
				this.pendingUri = null;
			}else if(this.show === true){
				Muib.set_osdvclass("hideanno", "add");
				label.data =  "Show " + this.btname;
				this.show = false;
			}else{
				Muib.set_osdvclass("hideanno", "remove");
				label.data = "Hide " + this.btname;
				this.show = true;
			}
		},
		ready: function(cond){
			this.pendingUri = null;
			this.btn.disabled = cond;
		},
		oth: function(tguri){
			if(this.btn.style.display === "none") Muib.jld.showbtn();
			this.pendingUri = tguri;
			this.btn.firstChild.data = "Load " + this.btname;
			this.btn.disabled = false;
		},
		searchres: function(){
			this.btn.style.display = "none";
			Muib.clip.showctrl(false);
		}
	},
	clip: {
		btn: null, ctl: null, allimg: null, area: null,
		btname: "Anno List",
		maxw: null,
		init_elt: function(jldctrl){
			if(!Muib.elt.jldb) return false;
			this.btn = Mut.dom.elt("button", "Show " + this.btname);
			this.btn.onclick = function(){Muib.clip.toggle();};
			this.ctl = Mut.dom.elt("span");
			this.ctl.style.display = "none";
			this.allimg = Mut.dom.elt("input", "", [["type", "checkbox"]]);
			Mut.dom.append(this.ctl, [this.btn, " ", 
				Mut.dom.append( Mut.dom.elt("label"), [this.allimg, "all pages"])]); 
			Mut.dom.append(jldctrl, [" ", this.ctl]);
			this.area = Mut.dom.get("#annoclip");
		},
		showctrl: function(showhide){
			if(!Muib.elt.jldb) return false;
			if(showhide === true){
				if(!Miiif.searchs.has_result)
				this.ctl.style.display = "inline";
			}else{
				this.ctl.style.display = "none";
			}
		},
		toggle: function (forceHide){
			if(!this.area) return false;
			var label = this.btn.firstChild;
			if(label.data.substr(0, 4) === "Hide" || forceHide){
				this.area.style.display = "none";
				label.data =  "Show " + this.btname;
				this.allimg.disabled = false;
			}else{
				this.gen_annoclip(this.area, this.allimg.checked);
				this.area.style.display = "flex"; //"block";
				label.data = "Hide " + this.btname;
				this.allimg.disabled = true;
			}
		},
		gen_annoclip: function (parnt, allimg){
			var fbox = "", dimx;
			if(!this.maxw) this.maxw = Manno.maxgw < 0.06 ? window.innerWidth * 2 : window.innerWidth;
			if(allimg){
				var uri;
				for(uri in Manno.page){
					dimx = Math.min(Mia.cinfo[uri].dim.x, this.maxw);
					Manno.page[uri].forEach(function(a){fbox += set_row(a, uri, dimx);});
				}
			}else{
				var an = anno.getAnnotations();
				dimx = Math.min(Mia.current.dim.x, this.maxw);
				an.forEach(function(a){fbox += set_row(a, Mia.current.keyuri, dimx);});
			}
			parnt.innerHTML = fbox;
			
			function set_row(an, uri, dimx){
				var dim, usefixed;
				if(Mia.cinfo[uri].imgurl){
					dim = {"x": dimx};
					uri = Miiif.full2mid(Mia.cinfo[uri].imgurl, dim.x);
					usefixed = true;
				}else{
					dim = Mia.current.dim;
					usefixed = false;
				}
				var pos = an.pix || Mwa.ratio2px(an, dim, usefixed),
				rect = [pos[1], pos[0]+pos[2], pos[1]+pos[3], pos[0]],
				text = Mut.get_attrsafe_string(an.text);
				return "<figure>" +
				"<div class=\"clip\" style=\"height:"+pos[3]+"px;width:"+pos[2]+"px;\">"+
				"<img src=\""+uri+"\" style=\"clip:rect(" + rect.join("px,") + "px);"+
				"margin-top:-" + pos[1] + "px;margin-left:-" + pos[0] + "px;\"/>"+
				"</div><figcaption title=\"" + text + "\">" +
				Muib.meta.trim_text(text, "short") +
				"</figcaption></figure>\n";
			}
		}
	},
	
	
	popclick: function (ev){
		var obj;
		if(window.event) obj = event.srcElement;
		else if(ev) obj = ev.target;
		if(obj.nodeType===3) obj = obj.parentNode;
		if(obj.nodeName.toLowerCase()==="a"){
			var dest = obj.getAttribute("href");
			if(dest && dest.charAt(0)==="#"){
				var moved = null;
				if(dest.match(/^#p(\d+)/)){
					moved = go(Number(RegExp.$1) - 1);
				}else if(dest === "#!next"){
					moved = go(Mia.current.pos + 1);
					setTimeout(function(){Muib.show_anno(0);}, 300);
				}else if(dest === "#!prev"){
					moved = go(Mia.current.pos - 1);
					setTimeout(function(){Muib.show_anno(-1);}, 300);
				}
				if(moved) return false;
			}
		}
		function go(page){
			return viewer.goToPage(Muib.tindex.get_pos(page));
		}
	},
	show_anno: function (idx){
		if(idx === -1) idx += Manno.current.length;
		anno.highlightAnnotation(Manno.current[idx]);
	},
	
	add_pop_more: function (text, whoid, i){
		var who = " <em class=\"who\"" + 
		(typeof(i) !== "undefined" ? " onclick=\"Manno.flipuser(" + i + ");\"" : "") +
		">(" + (at.whoswho[whoid] ? at.whoswho[whoid].dispname : whoid) + ")</em>";
		this.elt.popbox.innerHTML = this.elt.popbox.innerHTML ?
		this.elt.popbox.innerHTML + (
			text ? "<div class=\"more\">" + text + who + "</div>" : who
		) : (text ? text + who : who);
	},
	
	fadeio: function(elt, time, ov, z, to) {
		var stept = time / 20, stepo = 1 / 20, sid = '', lolim = 0, uplim = 1; 
		var set_opacity = function(opct){
			elt.style.opacity = opct;
		};
		if(ov === 1){
			stepo = 0 - stepo;
			if(typeof(to) !== "undefined") lolim = to;
		}else{
			setz();
			if(typeof(to) !== "undefined") uplim = to;
		}
		set_opacity(ov);
		sid = setInterval(function(){
			ov = Number((ov + stepo).toFixed(12));
			if(ov < lolim){
				ov = lolim;
				clearInterval(sid);
				setz();
			}else if(ov > uplim){
				ov = uplim;
				clearInterval(sid);
			}
			set_opacity(ov);
		}, stept);
		function setz(){
			if(typeof(z) !== "undefined") elt.style.zIndex = z;
		}
	},
	stepbgcolor: function(elt, time, bgc, to, stp){
		if(!stp) stp = 20;
		var stept = time / stp, sid = '', stepc =[], transp = false;
		if(to === "transparent"){
			transp = true;
			to = [255, 255, 255];
		}
		bgc.forEach(function(v, i){stepc[i] = (to[i] - v) / stp;});
		var set_color = function(bg){
			elt.style.backgroundColor = "rgb("+bg[0]+","+bg[1]+","+bg[2]+")";
		};
		set_color(bgc);
		sid = setInterval(function(){
			stepc.forEach(function(v, i){bgc[i] =Math.round(bgc[i] + v);});
			if((stepc[0] < 0 && bgc[0] < to[0]) ||
				(stepc[0] > 0 && bgc[0] > to[0])){
				bgc = to;
				clearInterval(sid);
			}
			set_color(bgc);
		}, stept);
		if(transp) elt.style.backgroundColor = "transparent";
	},
	do_after: function(after, fn) {
		if(this.state.dotimer){
			clearTimeout(this.state.dotimer);
		}
			this.state.dotimer = setTimeout(fn, after);
	},
	
	showthumb: function(o, thumburi){
		if(!this.elt.thumbox){
			var thumbox = Mut.dom.elt("img");
			thumbox.className = "thumb";
			thumbox.onclick = function(){Muib.showthumb(this.previousSibling);};
			this.elt.thumbox = thumbox;
		}
		if(!thumburi || o.nextSibling === this.elt.thumbox){
			o.parentNode.removeChild(this.elt.thumbox);
			o.style.background = "transparent";
		}else{
			this.elt.thumbox.setAttribute("src", thumburi);
			o.parentNode.appendChild(this.elt.thumbox);
			if(this.state.colthumb)
			this.state.colthumb.style.background = "transparent";
			o.style.background = "#ffa";
			this.state.colthumb = o;
		}
	},
	filter: function(val, what){
		if(typeof(Muib.elt.slider)==="undefined"){
			Mut.dom.append(
				Mut.dom.get("head")[0],
				Mut.dom.elt("script","",[["src", "/lib/js/osd/openseadragon-filtering.js"]])
			);
			Muib.elt.slider = false;
		}
		if(val===undefined && Muib.elt.slider === false){
			var slider = Mut.dom.elt("input","",[["type", "range"], ["min", -100], ["max", 100], ["value", 0]]);
			slider.style.verticalAlign = "top";
			slider.style.marginTop = "4px";
			slider.style.width = "80px";
			viewer.controls[0].element.appendChild(slider);
			slider.addEventListener("change", function(ev) {
				Muib.filter(ev.target.value, "BRIGHTNESS");
			});
			Muib.elt.slider = slider;
		}else{
			if(val==="i") what = "INVERT";
			else if(val==="g") what = "GREYSCALE";
			else if(!what) what = "BRIGHTNESS";
			if(val===undefined) val = 0;
			viewer.setFilterOptions({
				filters: {
					processors: OpenSeadragon.Filters[what](Number(val))
				}, 
				loadMode: 'sync'
			});
		}

	},
	layers: {
		elt: null,
		btn: null,
		flipper: null,
		sldivs: null,
		ctrl: null,
		cord: "b2t",//"t2b",
		saved: [],
		items: [],
		last_loaded: null,
		add_layer: function(){
			if(this.last_loaded === Mia.current.keyuri) return;
			var cinfo = Mia.cinfo[Mia.current.keyuri];
			this.last_loaded = Mia.current.keyuri;
			if(cinfo.layer){
				this.add_page_layer(cinfo);
				return true;
			}else{
				this.reset();
				return false;
			}
		},
		add_page_layer: function(cinfo){
			var op, t2b;
			if(cinfo.choice){
				op = 0;
				t2b = Muib.layers.cord === "t2b";
			}else{
				op = 1;
				t2b = false;
			}
			this.items = [cinfo.imgurl];
			if(Muib.opts.v.fb) viewer.viewport.fitBounds(Muib.pix2osdRect(Muib.opts.v.fb));
			cinfo.layer.forEach(one_layer, this);
			if(!cinfo.timedlayer) this.setup(cinfo.layer, cinfo.choice, t2b, op);
			
			function one_layer(o){
				if(!o.tile) return;
				var option = (typeof(o.tile) === "string" || o.tile.url) ? {
					"tileSource": o.tile
				} : o.tile;
				option.opacity = o.trange ? (o.trange[0]===0 ? 1 : 0) : op;
				if(t2b) option.index = 0;
				viewer.addTiledImage(option);
				this.items.push(o.tid);
			}
		},
		setup: function(layer, is_choice, t2b, ini_opc){
			if(!this.elt){
				this.elt = Mut.dom.elt("div");
				this.elt.id = "lyctrl";
				this.btn = Mut.dom.elt("span", is_choice ? "choice" : "layers", [["class", "toggler"]]);
				this.btn.onclick = function(){
					if(Muib.layers.ctrl.style.display === "none")
						Muib.layers.ctrl.style.display = "block";
					else Muib.layers.ctrl.style.display = "none";
				};
				this.flipper = Mut.dom.elt("span", "⇅", [["class", "flipper"]]);
				this.flipper.onclick = Muib.layers.flip;
				this.ctrl = Mut.dom.elt("div");
				this.ctrl.style.display = "none";
				if(layer.length >= 18){
					this.ctrl.style.maxHeight = (Muib.elt.osdv.clientHeight - 20) + "px";
					this.ctrl.style.overflowY = "scroll";
				}
				Mut.dom.append(this.elt, [this.btn, this.ctrl]);
				Mut.dom.append(Muib.elt.osdv, this.elt);
				this.saved = [];
			}
			this.ctrl.innerHTML = "";
			this.sldivs = Mut.dom.elt("div");
			var n = layer.length - 1, base = t2b ? n : 0;
			for(var i=n; i>=0; i--){
				var tgitem = t2b ? n - i : i;
				gen_slider(i, layer[tgitem], i===base, ini_opc, this);
			}
			Mut.dom.append(this.ctrl, [this.flipper, this.sldivs, Mut.dom.elt("div", "0 - opacity - 1 ")]);
			if(is_choice) Mut.dom.append(this.ctrl, add_splitter(t2b));
			this.elt.style.display = "block";
			
			function gen_slider(i, o, is_base, ini, that){
				var active = is_base || ini,
				div = Mut.dom.elt("div", "", [["title", o.label || "layer image "+i], ["data-i", i], ["class", active ? "on" : "off"]]),
				img = Mut.dom.elt("img", "", [["src", get_thumb(o)]]),
				slider = Mut.dom.elt("input","",[["type", "range"], ["min", 0], ["max", 100], ["value", 100]]);
				if(!active) slider.disabled = true;
				img.onclick = function(){Muib.layers.toggle(this);};
				slider.addEventListener("change", function(ev) {
					Muib.layers.setopacity(ev.target.value / 100, this.parentNode.getAttribute("data-i"));
				});
				if(is_base) slider.className = "base";
				Mut.dom.append(div, [img, slider]);
				Mut.dom.append(that.sldivs, div);
			}
			function get_thumb(obj){
				var ts, level, m;
				if(obj.tile){
					if((m = obj.tid.match(/^(.*)(\/info\.json|\.dzi|\.xml)$/))){
						ts = m[1];
						if(m[2] === "/info.json"){
							level = obj.level;
						}else{
							level = "dzi";
							ts += "_files/";
						}
					}else{
						ts = obj.tid;
						level = 0;
					}
				}else{
					var s = viewer.world.getItemAt(0).source;
					if(s["@context"]){
						var ctx = s["@context"].match(/\/([\d\.]+)\/context.json$/);
						ts = s["@id"];
						level = ctx ? ctx[1] : 1;
					}else if(s.tilesUrl){
						ts = s.tilesUrl;
						level = "dzi";
					}else{
						ts = s.url;
						level = 0;
					}
				}
				return ts + (level ? (
					level === "dzi" ? "7/0_0.jpg" : 
					("/full/30,/0/" + (level >= 2 ? "default" : "native") + ".jpg")
				) : "");
			}
			function add_splitter(t2b){
				var myname = "Splitter", btn = Mut.dom.elt("button", myname);
				btn.style.width = "100%";
				btn.onclick = function(){
					var label = this.firstChild,
					slider = Muib.layers.elt.getElementsByTagName("input");
					if(label.data===myname){
						label.data += " is ON";
						if(Muib.isTouchDev){
							viewer.gestureSettingsMouse.clickToZoom = false;
							viewer.panHorizontal = false;
							viewer.panVertical = false;
							viewer.addHandler("canvas-press", Muib.layers.split_we);
							viewer.addHandler("canvas-drag", Muib.layers.split_we);
						}else{
							Muib.elt.osdv.addEventListener("mousemove", Muib.layers.split_e, false);
						}
						for(var i=0,n=slider.length; i<n; i++){
							Muib.layers.saved[i] = slider[i].value;
							slider[i].value = 100;
							Muib.layers.setopacity(1, i);
						}
						this.style.backgroundColor = "#ffc9af";
						Muib.set_osdvclass("slider", "add");
					}else{
						label.data = myname;
						if(Muib.isTouchDev){
							viewer.gestureSettingsMouse.clickToZoom = true;
							viewer.panHorizontal = true;
							viewer.panVertical = true;
							viewer.removeHandler("canvas-press", Muib.layers.split_we);
							viewer.removeHandler("canvas-drag", Muib.layers.split_we);
						}else{
							Muib.elt.osdv.removeEventListener("mousemove", Muib.layers.split_e, false);
						}
						for(var i=0,n = viewer.world.getItemCount(); i<n; i++){
							viewer.world.getItemAt(i).setClip(null);
							var s = slider[n-i-1];
							s.value = Muib.layers.saved[n-i-1];
							Muib.layers.setopacity(s.value/100, i);
							Muib.layers.toggle(null, s.parentNode);
						}
						this.style.backgroundColor = "#ddd";
						Muib.set_osdvclass("slider", "remove");
					}
					
				};
				return btn;
			}
		},
		reset: function(){
			if(this.elt) this.elt.style.display = "none";
		},
		setopacity: function(op, i){
			viewer.world.getItemAt(i).setOpacity(op);
		},
		flip: function(){
			var vw = viewer.world,
			sc = Muib.layers.sldivs;
			for(var i=0,n=vw.getItemCount(); i<n-1; i++){
				vw.setItemIndex(vw.getItemAt(0), n-i-1);
				var bar = sc.removeChild(sc.childNodes[n-i-2]);
				bar.setAttribute("data-i", n-i-2);
				sc.appendChild(bar);
			}
			sc.firstChild.setAttribute("data-i", n-1);
		},
		toggle: function(tg, div){
			var onoff;
			if(tg){
				div = tg.parentNode;
				onoff = div.className === "on" ? "off" : "on";
			}else{
				tg = div.firstChild;
				onoff = div.className;
			}
			var slider = tg.nextSibling;
			if(onoff==="off"){
				div.className = "off";
				slider.disabled = true;
				Muib.layers.setopacity(0, div.getAttribute("data-i"));
			}else{
				div.className = "on";
				slider.disabled = false;
				Muib.layers.setopacity(slider.value / 100, div.getAttribute("data-i"));
			}
		},
		
		split_we: function(e){
			var wldpos = e.position;
			wldpos.x += Muib.elt.osdv.offsetLeft;
			wldpos.y += Muib.elt.osdv.offsetTop;
			Muib.layers.split_pos(wldpos);
		},
		split_e: function(e){
			Muib.layers.split_pos(new OpenSeadragon.Point(e.clientX, e.clientY));
		},
		split_pos: function(wldpos){
			var pos = viewer.world._items[0].windowToImageCoordinates(wldpos);
			this.splitter(pos);
		},
		splitter: function(pos){
			var n = viewer.world.getItemCount(),
			dim = viewer.source.dimensions;
			if(pos.x < -20 || pos.x > dim.x + 20) return;
			clip(n-1, 0, 0, n > 3 ? pos.x : dim.x+1, pos.y);
			if(n>2) clip(n-2, 0, 0, pos.x, dim.y);
			if(n>3) clip(n-3, 0, pos.y, dim.x, dim.y - pos.y);
			
			function clip(i, x, y, w, h){
				viewer.world.getItemAt(i).setClip(new OpenSeadragon.Rect(x, y, w, h));
			}
		}
	},

	opts: {
		v: {}, 
		iniosdpos: 0, 
		osdbr: null,
		base: null,
		dual: false,
		antparam: {"boxpfx": ".annotorious-ol-boxmarker-", "popup": ".annotorious-popup"},
		init: function(){
			for(var key in Mia.opts) this.v[key] = Mia.opts[key];
			if(location.hash){
				this.parse_frag(location.hash.substr(1));
			}
			if(location.search){
				location.search.substr(1).split(/[&;]/).forEach(function(kvs){
					var kv = kvs.split("=");
					this.v[kv[0]] = kv[1] ? decodeURIComponent(kv[1].replace(/\+/, " ")) : null;
				}, this);
			}
			this.base = this.v.u && this.v.u.match(/^https?:/) ? this.v.u : get_base(this.v.u || "");
			if(this.v.inf){
				if(! window.parent) this.v.inf = 0;
				else if(window.parent.ifr) this.dual = true;
			}
			
			function get_base(reluri){
				var a = Mut.dom.elt("a","",[["href", reluri]]);
				return a.href;
			}
		},
		parse_frag: function(frag){
			frag.split(/[&;]/).forEach(function(opt){
				if(opt.match(/^p(\d+)$/)) this.v.page = Number(RegExp.$1); else
				if(opt.match(/^([\w\d]+)=(.*)/)) this.v[RegExp.$1] = 
				decodeURIComponent(RegExp.$2.replace(/\+/, " "));
			}, this);
		},
		vc: function(key, val){
			return this.v[key] && this.v[key]===val;
		},
		pre_osd_multi: function(osdop){
			var stcanvas = (this.v.canvas ? Manno.keyuris.indexOf(this.v.canvas) : 0);
			if(stcanvas === -1){
				console.warn("Non existing startCanvas", this.v.canvas);
				stcanvas = 0;
			}
			Mia.current.syncpage = 
				this.v.page ? this.v.page - 1 : stcanvas;
			
			this.iniOsdPos = osdop["initialPage"] = Muib.tindex.get_pos(Mia.current.syncpage);
		},
		pre_osd: function(osdop, type){
			if(this.v.osd) for(var p in this.v.osd) osdop[p] = this.v.osd[p];
			if(this.v.z && this.v.z.match(/^\d+(\.\d+)?$/)) osdop.defaultZoomLevel = this.v.z;
			if(type !== "image") Mav.vinfo.dim = {x: Muib.elt.osdv.clientWidth, y: Muib.elt.osdv.clientHeight};
		},
		post_osd: function(){
			this.osdbr = OpenSeadragon.version.branch;
			Muib.refstrip.init();
			if(typeof(this.v.style) !== "undefined") this.set_style(this.v.style, true);
			else if(this.v.wm && (this.v.wm === "v" || this.v.wm === "vertical"))
			this.set_style("show-vertical", true);
			if(Muib.opts.dual) window.parent.show_gofar(Muib.opts.v.inf, Mia.ent.numTiles, Muib.opts.v.z, Muib.opts.v.fb);

		},
		initial_load: function(){
			if(this.v.xy) this.pan(this.v.xy);
			else if(this.v.xywh) this.fit_bounds(this.v.xywh);
			Muib.refstrip.setup();
		},
		
		set_style: function (style, use_replace){
			if(use_replace){
				style = style.replace(/show-vertical;?/, this.antparam.popup + " {writing-mode: vertical-rl; height:auto; max-height: 180px; min-height:120px; min-width: 60px;}").
				replace(/border_color:\s*([#\w\d]+);?/, this.antparam.boxpfx + "inner {border-color: $1}");
			if(!Object.assign) style = style.replace(/vertical-rl/, "tb-rl");
			}
			
			var ss = document.styleSheets;
			var st = ss[ss.length -1];
			var rules = style.match(/\s*([^{]+?\s*{[^}]+?})/g); 
			for(var i=0, n=rules.length; i<n; i++){
				st.insertRule(rules[i], st.cssRules.length);
			}
		},
		fit_bounds: function(xywh){
			var p = Mut.calc_pos(xywh);
			viewer.viewport.fitBounds(new OpenSeadragon.Rect(p[0], p[1], p[2], p[3]));
		},
		pan: function(pos){
			var p = Mut.calc_pos(pos + ",0,0");
			viewer.viewport.panTo({"x": p[0], "y": p[1]});
		}
	},
	pix2osdRect: function(xywh){
		var loc = Mut.split_as_num(xywh);
		return new OpenSeadragon.Rect(loc[0], loc[1], loc[2], loc[3]);

	},
	pix2viewportRect: function(frag, dimx){
		var loc = Mwa.px2ratio(Mut.split_as_num(frag), {"x": dimx});
		return new OpenSeadragon.Rect(loc[0], loc[1], loc[2], loc[3]);
	},
	style_set: function(obj, set){
		for(var key in set){
			obj.style[key] = set[key];
		}
	},
	prepare_osdview: function(type){
		if(!this.elt.osdv.className){
			var cls = (type === "image") ? "view" : type,
			dest = (type === "audio") ? [111,161,192] : [0,0,0];
			Muib.main_msg("", "normal");
			this.stepbgcolor(this.elt.osdv, 100, [240,240,240], dest, 10);
			this.elt.osdv.className = cls;
		}
	},
	reset_osdv_size: function(dim, force){
		var x, y, adjust, elt = this.elt.osdv;
		if((dim.x < elt.clientWidth && dim.y < elt.clientHeight) || force){
			adjust = 1;
		}else{
			adjust = this.adjust_dim(dim, {x:elt.clientWidth, y:elt.clientHeight});
		}
		if(adjust){
			elt.style.height = dim.y * adjust + "px";
			elt.style.width = dim.x * adjust + "px";
		}
		if(this.tindex.state.use) this.elt.tindex.style.height = elt.style.height;
		if(adjust && adjust !== 1 && Miiif.locfmedia){
			for(var u in Mia.cinfo){
				var ci = Mia.cinfo[u];
				if(ci.mf){
					for(var murl in ci.mf) ci.mf[murl].forEach(function(o,i){
						if(o.pos) for(var j=0; j<4; j++)
						ci.mf[murl][i].pos[j] *= adjust;
					});
					ci.adjust = adjust;
				}
			}
		}
	},
	adjust_dim: function(dim, testdim){
		var xadjust = testdim.x / dim.x,
		yadjust = testdim.y / dim.y;
		return Math.min(xadjust, yadjust);
	},
	set_abspos: function(node, pos, resetMinW){
		node.style.left = pos[0] + "px";
		node.style.top = pos[1] + "px";
		node.style.width = pos[2] + "px";
		node.style.height = pos[3] + "px";
		if(resetMinW) node.style.minWidth = 0;
		else node.style.position = "absolute";
	},
	prepare_env: function(msg){
		if(!this.elt.osdv){
			this.opts.init();
			this.elt.osdv = Mut.dom.get(Mia.eltmap.osdv, "id");
			this.elt.maindiv = Mut.dom.get(Mia.eltmap.maindiv, "id") || this.elt.osdv.parentNode;
			this.elt.msg = Mut.dom.elt("p", "", [["class", "msg"]]);
			Mut.dom.append(this.elt.osdv, this.elt.msg);
			Muib.main_msg(msg, "loading");// + " ..."
			this.elt.jldarea = Mut.dom.elt("textarea", "", [["id", "jld"]]);
			Mut.dom.append(this.elt.osdv, this.elt.jldarea);
			this.elt.jldb = Mut.dom.elt("button", "Show JSON-LD", [["id", "showjld"]]);
			this.elt.jldb.onclick = function(){Muib.jld.toggle(this);};
			var jldctrl = Mut.dom.elt("div");
			Mut.dom.append(jldctrl, this.elt.jldb);
			this.elt.imgdsc = Mut.dom.elt("div", "", [["id", "imgdsc"], ["class", "metainfo"]]);
			Mut.dom.append(this.elt.maindiv, this.elt.imgdsc);
			Mut.dom.append(this.elt.maindiv, jldctrl);
			Mut.dom.append(this.elt.maindiv, Mut.dom.elt("div","",[["id", "annoclip"]]));
			this.annobox.init_elt(jldctrl);
			this.clip.init_elt(jldctrl);
			this.elt.jldctrl = jldctrl;
			var lang = navigator.userLanguage || navigator.language;
			this.env.lang = Mut.preflang = lang.substr(0,2).toLowerCase();
			this.state.uribase = this.opts.v.u ? (this.opts.v.u.match(/^https?:/) ?
			this.opts.v.u.split('/').slice(0,-1).join('/') + '/' : "") : "";
			if(this.isTouchDev) this.env.flick_threshold = 1000;
			
			this.elt.osdv.addEventListener('drop', function(e) {
				e.stopPropagation();
				e.preventDefault();
				var manifest = e.dataTransfer.getData("Text");
				if(manifest.match(/^http/)) location = "?u=" + encodeURIComponent(manifest);
				else console.log("non url drop", manifest);
			}, false);

			this.elt.osdv.addEventListener('dragover', function(e) {
			    e.preventDefault();
			});
		}
	}
};


var Mut = {
	prop: {lang: "language", langedval: "value", val: "value"},
	preflang: null,
	set_prop: function(mode){
		this.prop = mode === "iiif" ?
		{lang: "@language", langedval: "@value", val: "value"} :
		{lang: "language", langedval: "value", val: "value"};
	},
	dom: {
		elt: function(eltname, text, attrs){
			var elt = document.createElement(eltname);
			if(text) elt.appendChild(document.createTextNode(text));
			if(attrs){
				attrs.forEach(function(attr){
					elt.setAttribute(attr[0], attr[1]);
				});
			}
			return elt;
		},
		append: function(pelt, node){
			if(node instanceof Array)
				node.forEach(function(n){xappend(pelt, n);});
			else xappend(pelt, node);
			function xappend(p, c){
				if(c.nodeType === undefined) c = document.createTextNode(c);
				p.appendChild(c);
			}
			return pelt;
		},
		prepend: function(pelt, node){
			if(typeof(node) === "string") node = document.createTextNode(node);
			pelt.insertBefore(node, pelt.firstChild);
		},
		ashtml: function(text){
			if(text.match(/</)){
				var span = Mut.dom.elt("span");
				span.innerHTML = text;
				return span;
			}else{
				return text;
			}
		},
		get: function(key, by){
			if(by){
				if(by === "id") return document.getElementById(key);
				else if(by === "class") return document.getElementsByClassName(key);
				else if(by === "tag") return document.getElementsByTagName(key);
			}else{
				var comp = key.match(/^([#\.])(.+)$/);
				if(!comp) return document.getElementsByTagName(key);
				else if(comp[1] === "#") return document.getElementById(comp[2]);
				else if(comp[1] === ".") return document.getElementsByClassName(comp[2]);
			}
		},
		select: function(selector){
			return document.querySelector(selector);
		}
	},
	get_lang_text: function (obj){
		if(!obj){
			return "";
		}else if(obj instanceof Array){
			if(obj.length === 0) return "";
			obj = this.get_lang_obj(obj);
		}
		if(typeof(obj)==="string"){// || typeof(obj)==="number"
			return obj;
		}else if(obj[this.prop.langedval] !== undefined){
			return obj[this.prop.langedval];
		}else if(obj[this.prop.val] !== undefined){
			return obj[this.prop.val];
		}else if(obj[this.prop.lang]){
			console.warn("no value, only", this.prop.lang, obj[this.prop.lang]);
			return "(no value w/ " + this.prop.lang + ": '" + obj[this.prop.lang] + "')";
		}else{
			console.warn("non string:", obj, " (type) ", typeof(obj));
			return String(obj);
		}
	},
	get_lang_obj: function(arrobj){
		var str=[],
		glue="; ",
		res={},
		ro = {},
		lang;
		res[this.preflang] = [];
		if(this.preflang !== "en") res.en = [];
		arrobj.forEach(function(o){
			if(o[this.prop.lang] && typeof(o[this.prop.langedval]) !== "undefined"){
				lang = o[this.prop.lang].substr(0,2);
				if(!res[lang]) res[lang] = [];
				res[lang].push(o[this.prop.langedval]);
			}else if(typeof(o) === "string"){
				str.push(o);
			}else if(o.value && typeof(o.value) === "string"){
				str.push(o.value);
			}else if(o instanceof Array){
				res[this.preflang].push(this.get_lang_text(o));
			}
		}, this);
		if(res[this.preflang].length) {
			ro[this.prop.lang] = this.preflang;
			ro[this.prop.langedval] = res[this.preflang].join(glue);
		}else if(res.en.length){
			ro[this.prop.lang] = "en";
			ro[this.prop.langedval] = res.en.join(glue);
		}else if(str.length) ro = str.join(glue);
		else ro = arrobj[0];
		if(Muib.meta.lang.watch) set_lang_opts(this);
		return ro;
		
		function set_lang_opts(that){
			Object.keys(res).forEach(function(lng){
				if(res[lng].length){
					Muib.meta.lang.opts[lng] = true;
					if(lng === ro[that.prop.lang]) Muib.meta.lang.selected = lng;
				}
			});
		}
	},
	get_safe_text: function (obj){
		if(!obj) return "";
		var res = this.get_lang_text(obj);
		return this.get_safe_string(res);
	},
	get_safe_string: function(str){
		return typeof(str) === "string" ? str.replace(/<script/g, "&lt;script").
		replace(/<(\w[^>]+)>/g, function(tag){
			var aa=[];
			tag.split(/\s+/).forEach(function(a){aa.push(a.replace(/^on/i, 'non'));});
			return aa.join(' ');
		}).
		replace(/  +/g, " ") : str;
	},
	get_attrsafe_string: function(str){
		return str.replace(/<.*?>/g, "").replace('"', "'"); //"
	},
	get_first: function (obj){
		return (obj instanceof Array) ? obj[0] : obj;
	},
	get_oneuri: function (obj){
		if(!obj) return "";
		return typeof(obj) === "string" ? obj : (obj[Miiif.a.id] ? obj[Miiif.a.id] : "");
	},
	merge: function (obj1, obj2) {
		for(var attr in obj2) {
			if(obj2.hasOwnProperty(attr)) obj1[attr] = obj2[attr];
		}
	},
	copy: function(sobj){
		if(typeof(sobj) !== "object") return sobj;
		var dobj;
		if(sobj instanceof Array){
			dobj = [];
			sobj.forEach(function(o){
				dobj.push(this.copy(o));
			}, this);
		}else{
			dobj = {};
			for(var p in sobj) dobj[p] = this.copy(sobj[p]);
		}
		return dobj;
	},
	disp_uri: function(uri){
		var comp = uri.split('/');
		return comp.length > 4 ? comp.slice(0,3).join('/') + "/ ... " + comp.pop() : uri;
	},
	filename: function(uri){
		return typeof(uri) === "string" ? uri.replace(/#[^#]+$/, "").split(/[\/\?]/).pop() : uri;
	},
	short_fname: function(uri){
		var fname = uri.replace(/^https?:\/{2}/, "");
		if(fname.length < 30) return fname;
		else return [fname.substr(0, 10), fname.substr(-14, 14)];
	},
	filesignat: function(uri){
		return typeof(uri) === "string" ? uri.split('/').splice(-2).join('/') : uri;
	},
	set_fileaction_info: function(pfx, uri){
		var sfname = this.short_fname(uri),
		what = Miiif.use ? "canvas" : "image";
		pfx += " ";
		return [pfx + sfname[1], pfx + what + " (" + sfname[0] + "..." + sfname[1] + ")"];
	},
	gen_anchor: function(link, text){
		if(!text) text = link;
		return "<a href=\"" + link.replace('&', '&amp;')+"\">" + text + "</a>";
	},
	text_or_link: function(text){
		return text ? (String(text).match(/^https?:[^ ]+$/) ? 
			this.gen_anchor(String(text), text) :
		Muib.meta.fold_text(String(text))) : "";
	},
	base_frag: function (uri){
		if(typeof(URL)==="function"){
			var u = new URL(uri, Muib.opts.base), res = [];
			if(u.hash){
				res[0] = u.protocol+"//" + u.host + u.pathname + u.search;
				u.hash.substr(1).split(/&/).forEach(function(h){
					if(h.substr(0,4)==="xywh") res[1] = h.substr(5);
					else if(h.substr(0,2)==="t=") res[2] = h.substr(2);
					res[3] = u.hash.substr(1);
				});
			}else res = [u.href, "", "", ""];
			return res;
		}else{
			var m;
			if(uri && (m = uri.match(/^(.+)#([^#]+)$/))){
				if(m[2].match(/^(.*?)&?t=([\d,\.]+)&?(.*)$/)){
					return [m[1], RegExp.$1 + RegExp.$3, RegExp.$2, m[2]];
				}else{
					return [m[1], m[2], "", m[2]];
				}
			}else{
				return [uri, "", "", ""];
			}
		}
	},

	calc_pos: function(pos, dim){
		if(pos.match(/^(pct|percent):(.*)/)){
			p = Mwa.pct2ratio(RegExp.$2.split(","));
		}else{
			p = Mwa.px2ratio(pos.split(","), dim || viewer.source.dimensions);
		}
		return p;
	},
	split_as_num: function(str, sep){
		if(!sep) sep = ",";
		if(typeof(str)==="string"){
			var res = [];
			str.split(sep).forEach(function(n){res.push(Number(n));});
			return res;
		}else{
			return str;
		}
	},
	add_array: function(tarr, tidx, val){
		if(!tarr[tidx]) tarr[tidx] = [];
		tarr[tidx].push(val);
	},
	concat_array: function(tarr,tidx, newarr){
		tarr[tidx] = tarr[tidx] ? tarr[tidx].concat(newarr) : newarr;
	},
	uniq_push: function(arr, val){
		if(arr.indexOf(val) === -1) arr.push(val);
	},
	uniq_add_array: function(tarr, tidx, val){
		if(!tarr[tidx]) tarr[tidx] = [];
		else if(tarr[tidx].indexOf(val) !== -1) return;
		tarr[tidx].push(val);
	},
	array_circular: function(aobj, val, max, reserve){
		if(aobj.length >= max){
			if(reserve){
				var recent = aobj.slice(reserve + 2, max);
				if(aobj[reserve] === "**sliced"){
					aobj = aobj.slice(0, reserve + 1);
				}else{
					aobj = aobj.slice(0, reserve);
					aobj.push("**sliced");
				}
				aobj = aobj.concat(recent);
			}else{
				aobj = aobj.slice(1, max);
			}
		}
		aobj.push(val);
		return aobj;
	},
	prepare_obj: function(obj, key){
		if(!obj[key]) obj[key] = {};
	},
	countup: function(obj, val){
		if(!obj[val]) obj[val] = 1;
		else obj[val]++;
	},
	num: {
		asc: function(a, b){
			return a - b;
		},
		desc: function(a, b){
			return b - a;
		},
		nasc: function(a, b){
			return Number(a) - Number(b);
		},
		ndesc: function(a, b){
			return Number(b) - Number(a);
		}
	},
	resolve_uri: function(partial){
		if(!partial.match(/^(https?|urn):/)) return Muib.state.uribase + partial;
		else return partial;
	}
};

