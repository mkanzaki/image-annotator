/// avannot.js by KANZAKI, Masahide. ver 1.18, 2017-08-09. MIT license.
"use strict";
var Mia, Mpj, Manno, Muib, Miiif, Mut, Mwa, anno, at, viewer, YT;
var Mav = {
	v: null,
	state: {lastsec: 0, selstart: 0, selend: 0, initpos: 0, tfrag: false, keeper: 0, dim_done: false, cvdim: true, audiothubm: false},
	opts: {minw: "600px", autostart: false, autopos: false, volume: 0.35, ctrls: false},
	vinfo: {dim: {x: null, y: null}, url: "", filler: null, bgtile: false},
	cvurl: null,
	cinfo: {}, 
	type: null,
	char_timer: "",
	touchplay: null,
	muris: [],
	melts: {},
	multicv: false,
	init: function(url, type, tile_len){
		if(tile_len) this.vinfo.bgtile = true;
		this.type = type;
		Manno.use_avanno = true;
		this.muris = Object.keys(Miiif.medias);
		if(Miiif.use){
			this.cvurl = Miiif.cvulist[Muib.opts.v.page || 0];
			this.cinfo = Mia.cinfo[this.cvurl];
		}
		if((type === "simple") ||
			Miiif.max_cvmedia > 1 ||
			(Miiif.cvulist.length > 1 && !Mia.jsource.structures)
		){
			this.init_ccm(type);
		}else{
			this.opts.ctrls = true;
			switch(type){
			case "youtube":
				Mytb.init(url); break;
			case "audio":
				Mau.init(url); break;
			case "video":
			default:
				Mvd.init(url);
			}
		}
		this.set_region_info();
	},
	init_ccm: function(type){
		if(Miiif.cvulist.length > 1) this.multicv = true;
		this.setup_osdcnvs();
		this.vinfo.dim = {x: Muib.elt.osdv.clientWidth, y: Muib.elt.osdv.clientHeight};
		if(viewer.source === null && Mia.ent.numTiles === 0) this.set_filler();
		this.map_handlers(type);
		this.set_annotroious_handlers();
		this.clock.use = true;
		this.clock.setup();
		if(!Muib.elt.tindex && this.multicv) this.setup_cvindex();
	},
	start_pos: function(vurl){
		this.vinfo.url = vurl.replace(/#[^#]+$/, "");
		var keyuri = Mav.key_uri(),
		ci = Mia.cinfo[keyuri];
		if(Muib.opts.v.t){
			if(Muib.opts.v.t === "auto"){
				this.opts.autopos = true;
			}else{
				var trange = Muib.opts.v.t.split(',');
				this.state.initpos = Math.floor(trange[0]);
				if(trange[1]) Mav.state.endpos = Math.floor(trange[1]);
				this.state.tfrag = Muib.opts.v.t;
			}
		}else if(ci && ci.duration){
			if(ci.mf && ci.mf[ci.mediaurl][0].bodyt) this.state.initpos = ci.mf[ci.mediaurl][0].bodyt[0];
			if(ci.timeMode && ci.timeMode === "trim"){
				this.state.tfrag = "0," + ci.duration;
			}
		}
	},
	setup_elt: function(){
		this.set_elt_size(this.v);
		this.setup_osdcnvs();
		Muib.elt.osd_cntner.insertBefore(this.v, viewer.buttons.element.parentNode.parentNode);
		if(Muib.isTouchDev){
			Mav.v.load();
			add_playbtn();
		}
		function add_playbtn(){
			Mav.touchplay = Mut.dom.elt("button", "play");
			Mav.touchplay.onclick = function(e){
				var label = e.target.firstChild;
				if(label.data === "play"){
					Mav.v.play();
					label.data = "pause";
				}else{
					Mav.v.pause();
					label.data = "play";
				}
			};
			Mut.dom.append(Muib.elt.jldctrl, [" ", Mav.touchplay]);
		}
	},
	set_elt_size: function(elt){
		elt.style.zIndex = -1;
		elt.style.position = "absolute";
		elt.style.top = this.vinfo.bgtile ? this.vinfo.dim.y + "px" : "0px";
		elt.style.minWidth = this.opts.minw;
	},
	setup_osdcnvs: function(){
		Mut.dom.get(".annotorious-item")[0].style.zIndex = 1;
		Muib.elt.osd_cntner = Mut.dom.get(".openseadragon-container")[0];
		Muib.elt.osd_cntner.style.overflow = "visible";
		Muib.elt.osd_cnvs = Muib.elt.osd_cntner.firstChild;
		Muib.elt.osd_cnvs.style.overflow = "visible";
	},
	set_media_handlers: function(){
		this.v.addEventListener("load", function(ev) {
			console.log("loaded");
			Muib.main_msg("done load media");
		}, false);
		this.v.addEventListener("canplay", function(ev) {
			if(!Mav.state.dim_done) Mav.v.volume = Mav.opts.volume;
			Mav.dimension_and_annot(ev.target);
			Mav.annot.set_rewind(Mav.sec_now(), true);
			if(Mav.opts.autostart) Mav.v.play();
		}, false);
		this.v.addEventListener("timeupdate", function(ev) {
			var now;
			if((now = Mav.sec_now()) > Mav.state.lastsec){
				Mav.annot.check(now, Mav.state.lastsec);
				Mav.state.lastsec = now;
			}else if(now < Mav.state.lastsec){
				Mav.annot.set_rewind(now, false);
			}
		}, false);
		this.v.addEventListener("pause", function(ev) {
			if(Mav.touchplay) Mav.touchplay.textContent = "play";
			Mav.clock.playing = false;
		}, false);
		this.v.addEventListener("play", function(ev) {
			if(Mav.touchplay) Mav.touchplay.textContent = "pause";
			Mav.clock.playing = true;
		}, false);
		this.v.addEventListener("error", function(ev) {
			Muib.set_status("auto");
			console.log(ev);
			Muib.main_msg("media load error");
			if(Mav.type === "audio") Muib.elt.msg.style.fontSize = "100%";
		}, false);
		
	},
	set_annotroious_handlers: function() {
		anno.addHandler("onSelectionStarted", function(ev){
			Mav.state.selstart = Mav.sec_now();
		});
		anno.addHandler("onSelectionCompleted", function(ev){
			Mav.state.selend = Mav.sec_now();
			Mav.pause();
		});
		anno.addHandler("onSelectionCanceled", function(e){
			Mav.resume();
		});
		this.setup_annobox();
	},
	setup_annobox: function(){
		var antboxpfx = ".noregion " + Muib.opts.antparam.boxpfx;
		var boxsel = [];
		["outer", "inner"].forEach(function(io){boxsel.push(antboxpfx+io); }); 
		Muib.opts.set_style(boxsel.join(",") + "{border-color:#" + Mau.opts.bghex + " !important}", false);
		anno.addHandler("onMouseOverAnnotation", function(an){
			if(Mav.annot.showing[an.id] && Mav.annot.showing[an.id] === "clone") Mav.annot.clone[an.id].style.opacity = 0;
		});
		Muib.opts.set_style("border_color:yellow;", true);
	},
	map_handlers: function(type){
		Manno.set_changed = function(delta, an){Mav.annot.set_changed(delta, an);};
		Manno.get_annotation = function(){return Mav.annot.get(type);};
		Manno.key_uri = function(){return Mav.key_uri();};
		Manno.set_new = function(an){Mav.annot.set_new(an);};
	},
	dimension_and_annot: function(tgelt){
		if(Mav.state.dim_done) return;
		Mav.v.style.zIndex = 0;
		if(Mav.vinfo.bgtile) set_current_elt(this);
		else set_dimension(this, tgelt);
		Muib.reset_osdv_size(Mav.vinfo.dim, true);
		positions(this);
		Mav.state.lastsec = Mav.state.initpos - 1;
		Mav.state.dim_done = true;
			
		function set_dimension(that, tgelt){
			if(Mia.ent.numTiles === 0){
				if(tgelt.clientHeight){
					Mav.vinfo.dim = {x: tgelt.clientWidth, y: tgelt.clientHeight};
				}else if(tgelt.style.height){
					Mav.vinfo.dim = {x: wh2num(tgelt, "minWidth"), y: wh2num(tgelt, "height")};
				}
				viewer.viewport._contentAspectRatio = Mav.vinfo.dim.x / Mav.vinfo.dim.y;
				that.set_filler();
			}
			if(Miiif.cvulist.length > 1){
				var url = Miiif.cvulist[0];
				Manno.update_imgdesc(url, Mia.cinfo[url].label ||
					"Canvas 1/" + Miiif.cvulist.length);
			}
		}
		function wh2num(elt, which){
			return Number(elt.style[which].replace(/px$/, ""));
		}
		function set_current_elt(that){
			if(!that.clock.use){
				Muib.elt.imgdsc.style.visibility = "hidden";
				Muib.elt.imgdsc.style.height = (Muib.elt.media.clientHeight - 2) + "px";
				Muib.elt.media.style.width = Mav.vinfo.dim.x + "px";
			}
		}
		function positions(that){
			if(Mav.type === "audio" && !Mav.vinfo.bgtile){
				Mau.annogeom = Mwa.pct2ratio(Mau.annopos, Mau.opts.dim);
				Mau.set_audio_msg();
			}else{
				var u = Mav.key_uri() || that.vinfo.url,
				mf = Mia.cinfo[u].mf ? Mia.cinfo[u].mf[that.vinfo.url] : null,
				vpos = mf ? (mf[u] ? mf[u].pos : null) : null;
				if(vpos) that.setpos(that.v, vpos, true);
				Muib.main_msg("done media setup");
			}
		}
	},
	set_filler: function(){
		this.vinfo.filler = filler_url();
		viewer.addSimpleImage({url: this.vinfo.filler});
		Mia.cinfo[this.vinfo.filler] = {mediaurl: this.vinfo.url};
		if(Manno.keyuris[0] !== this.vinfo.url) Mia.cinfo[this.vinfo.filler].map = Manno.keyuris[0];
		if(this.type === "audio" && this.cinfo && this.cinfo.thumbnail){
			viewer.addSimpleImage({url: Mav.cinfo.thumbnail});
			this.state.audiothubm = true;
		}
		
		
		function filler_url(){
			return "/works/2016/pub/images/filler?x=" + Mav.vinfo.dim.x + 
			"&y=" + Mav.vinfo.dim.y + (Mav.type === "audio" ? "&c=" + Mau.opts.bghex + "00" : ""); 
		}
	},
	setpos: function(node, pos, resetMinW){
		node.style.left = pos[0] + "px";
		node.style.top = pos[1] + "px";
		node.style.width = pos[2] + "px";
		node.style.height = pos[3] + "px";
		if(resetMinW) node.style.minWidth = 0;
		else node.style.position = "absolute";
	},
	sec_now: function() {
		if(Mav.clock.use) return Mav.clock.now;
		else return Math.floor(this.v.currentTime);
	},
	key_uri: function(){
		if(this.cvurl) return this.cvurl;
		else if(!viewer.source) return Manno.keyuris[0];
		var su = viewer.source.canvas || viewer.source.url, 
		imginfo = Mia.cinfo[su];
		return imginfo.map || imginfo.mediaurl || su;
	},
	turn_page: function(url, ofst){
		var pos = Miiif.cvulist.indexOf(url) + ofst,
		newuri = Miiif.cvulist[pos];
		if(!newuri){
			console.log(pos, url);
		}else{
			this.set_newpage(newuri, this.cvurl, false, 0, pos);
			this.start();
		}
	},
	set_newpage: function(newuri, prevuri, from_tindex, now, pos){
		if(!newuri) console.log("new uri not defined");
		this.cvurl = newuri;
		this.cinfo = Mia.cinfo[newuri];
		var stepfade;
		if(Mia.ent.numTiles > 1){
			viewer.goToPage(Muib.tindex.get_pos(pos));
			stepfade = false;
		}else{
			Mia.proc_loaded(null, newuri);
			stepfade = false;//true;
			if(Muib.tindex.state.use && !from_tindex) Muib.tindex.set_current_li(pos);
		}
		this.annot.update_anno(newuri, prevuri);
		if(this.state.audiothubm) update_audio_thumb(this.cinfo);
		this.clock.setup();
		if(this.clock.timer) window.clearInterval(this.clock.timer);
		this.setup_page_media(newuri, stepfade);
		this.set_region_info();
		if(now !== undefined){
			this.clock.playing = false;
			this.state.lastsec = -2;
			this.clock.update(now);
		}
		
		function update_audio_thumb(cinfo){
			if(cinfo.thumbnail){
				var thumb = viewer.world.getItemAt(1);
				if(thumb) viewer.world.removeItem(thumb);
				viewer.addSimpleImage({url: cinfo.thumbnail});
			}
		}
	},
	set_region_info: function(){
		this.state.cvdim = this.type !== "audio" ? true : ((this.cinfo && this.cinfo.dim) ? (this.cinfo.dim.x ? true : false) : false);
		this.toggle_classname(Muib.elt.osd_cntner, "noregion", !this.state.cvdim);
	},
	toggle_classname: function(elt, classname, use){
		var spcname = " " + classname;
		if(use){
			if(!elt.className.match(spcname)) elt.className += " " + classname;
		}else{
			if(elt.className.match("^(.*?)"+spcname)) elt.className = RegExp.$1;
		}
	},
	setup_page_media: function(url, stepfade){
		var cinfo = Mia.cinfo[url];
		if(!cinfo) return;
		if(cinfo.mf) for(var murl in cinfo.mf){
			cinfo.mf[murl].forEach(function(o){
				var id = this.annot.gen_id(murl, o);
				if(!Mav.melts[id]){
					if(!this.clock.use) Mav.melts[id] = true;
					else{
						this.gen_elt(id, murl, o, false);
						if(!o.t || o.t[0] === 0) Mav.melts[id].style.display = "block";
					}
				}
			}, this);
		}
		var numcv = Miiif.cvulist.length,
		disp = cinfo.label || (numcv > 1 ? "Canvas " + (Miiif.cvulist.indexOf(url) + 1) + "/" + numcv : "");
		if(disp) Manno.update_imgdesc(url, disp, stepfade);
		
	},
	gen_elt: function(id, murl, o, salone_init){
		var elt = (o.type === "Text") ?
		gen_new_elt(id, "div", o.val, [["class", "text" + o.class]]) :
		gen_media_elt(id, murl, o, salone_init, this);
		if(salone_init) return elt;
		Mav.melts[id].style.display = "none";
		Muib.elt.osd_cntner.insertBefore(
			Mav.melts[id],
			viewer.buttons.element.parentNode.parentNode
		);
		if(o.pos) set_eltpos(id, o.pos);
		function gen_media_elt(id, murl, o, salone_init, that){
			var attr = o.choice ? [] : [["src", murl]],
			type = o.type.toLowerCase();
			if(Mav.opts.ctrls) attr.push(["controls", ""]);
			if(o.vtt) attr.push(["crossorigin", "anonymous"]);
			var elt = gen_new_elt(id, type, "", attr);
			if(!salone_init && !that.clock.use){
				that.set_elt_size(elt);
				if(that.type === "audio") Mau.set_height(elt);
			}
			if(o.choice){
				elt.appendChild(gen_src_elt(murl, type, o.format));
				o.choice.id.forEach(function(id, i){
					elt.appendChild(gen_src_elt(id, type, o.choice.format[i]));
				});
			}
			if(o.vtt){
				o.vtt.forEach(function(v, i){elt.appendChild(gen_track_elt(v, i)); });
			}
			elt.onclick = function(e){e.target.controls = !e.target.controls;};
			if(!Mav.v) Muib.elt.media = Mav.v = elt;//Mav.melts[id];
		}
		function gen_new_elt(id, type, text, attr){
			Mav.melts[id] = Mut.dom.elt(type, text, attr);
			return Mav.melts[id];
		}
		function gen_src_elt(url, type, format){
			var attr = [["src", url]], m;
			if(!format){
				if((m = url.match(/\.([^\.]+)$/)))
				format = type + "/" + m[1];
			}
			if(format) attr.push(["type", format]);
			return Mut.dom.elt("source", "", attr);
		}
		function gen_track_elt(vtt, i){
			var label = vtt.label || vtt.language || "language " + (i+1), 
			attr =  [["label", label], ["kind", "subtitles"], ["src", vtt.id]];
			if(vtt.language) attr.push(["srclang", vtt.language]);
			if(i === 0) attr.push(["default", ""]);
			return Mut.dom.elt("track", "", attr);
		}
		function set_eltpos(id, pos){
			if(Mav.cinfo.dim && Mav.cinfo.dim.x && (Mav.cinfo.dim.x !== Mav.vinfo.dim.x || Mav.cinfo.dim.y !== Mav.vinfo.dim.y)){
				var z = viewer.viewport.getHomeZoom();
				if(!Mav.cinfo.adjust){
					Mav.cinfo.adjust = Muib.adjust_dim(Mav.cinfo.dim, Mav.vinfo.dim) * z;
					for(var i=0; i<4; i++) pos[i] *= Mav.cinfo.adjust;//Math.round(pos[i] *);
				}
				if(z !== 1){
					if(!Mav.cinfo.zoffset) Mav.cinfo.zoffset = viewer.viewport.imageToWindowCoordinates(new OpenSeadragon.Point({x:0, y:0}));
					pos[0] += Mav.cinfo.zoffset.x;
					pos[1] += Mav.cinfo.zoffset.y;
				}
			}
			Mav.setpos(Mav.melts[id], pos, false);
		}
	},
	setup_cvindex: function(){
		Muib.tindex.state.use = true;
		Muib.tindex.prepare(Muib.elt.osdv);
		Miiif.cvulist.forEach(function(u, i){
			if(!Mia.cinfo[u].label) Mia.cinfo[u].label = "Canvas " + Number(i+1);
		});
		Muib.tindex.setup({});
		Muib.tindex.set_current_li(0);
	},
	
	annot: {
		start: {},
		end: {},
		durs: {},
		repo: {},
		repokeys: ["start", "end", "st_media", "ed_media", "durs", "trim"],
		showing: {},
		auftakt: {},
		idx: {},
		st_media: {}, 
		ed_media: {}, 
		up_media: {}, 
		range: [],
		ann_popup: null,
		clone: {},
		pre_expose: false,
		noreg: {pos: [20,0,5,3], frag: "", pixpos: [], num: 0, wrapper: null, testpos: {}},
		state: {setup_done: false, rewinded: false},
		
		setup: function(){
			if(this.state.setup_done) return;
			this.state.setup_done = Mia.setup_done = true;
			var keyuri = Mav.key_uri();
			if(Mav.vinfo.bgtile && !Miiif.tfmedia){
			}
			if(!Mia.oa || Object.keys(Mia.oa).length === 0){
				if(Mia.cinfo[keyuri] && Mia.cinfo[keyuri].other){
					Miiif.add_other_content(keyuri);
				}else{
					var oa = {};
					this.resolve_deferred(oa, 0);
					if(Object.keys(oa).length){
						this.do_setup(oa);
					}else{
						this.update_anno(keyuri, null);
						Mav.setup_page_media(keyuri);
					}
				}
			}else{
				this.resolve_deferred(Mia.oa, 0);
				this.do_setup(Mia.oa);
			}
			if(Mav.cinfo.duration) Mav.clock.add_timeline(Mav.cinfo.duration);
		},
		do_setup: function(oa){
			this.noreg.frag = "percent:" + this.noreg.pos.join(",");
			this.prepare_popup();
			var Mediaurl,
			Offset,
			Geomdim;
			for(Mediaurl in oa){
				Geomdim = Mia.cinfo[Mediaurl].dim || 
				(Mav.vinfo.bgtile ? viewer.source.dimensions : Mav.vinfo.dim);
				Offset = Mia.cinfo[Mediaurl].offset;
				oa[Mediaurl].forEach(set_annotorious, this);
			}
			this.range = [
				Object.keys(this.start).sort(Mut.num.asc).shift(),
				Object.keys(this.end).sort(Mut.num.desc).shift()
			];
			if(Mav.opts.autopos || (!Mav.state.initpos && this.range[0] > 30)){
				var st = Number(this.range[0]) - (Mav.opts.autopos ? 0: 3);
				if(Mytb.vid){
					if(!Mav.opts.autostart) Mav.state.keeper = Mytb.c.SEEK_WAIT;
					Mytb.player.seekTo(st, true);
				}else{
					Mav.v.src += "#t=" + st;
				}
			}
			
			var keyuri = Mav.key_uri();
			this.update_anno(keyuri, null);
			Mav.setup_page_media(keyuri);
			
			Muib.jld.showbtn();
			if(Mav.vinfo.bgtile)
				;//画像のロードを待ってから。Manno.update_annoに任せる
			else if(Mav.state.keeper !== Mytb.c.SEEK_WAIT)
				this.check(Mav.state.initpos, Mav.state.initpos-1);
			else if(Mav.opts.autopos)
				this.check(Mav.state.lastsec, Mav.state.lastsec-1);
			
			
			function set_annotorious(an){
				var sel = an.target.selector ? an.target.selector.value : null,
				ci = Mia.cinfo[Mediaurl],
				frag = {}, has_region;
				if(!sel){
					if(typeof(an.target) === "string") an.taget = {id: an.target};
					if(an.target.id.match(/#(.*)$/)) sel = RegExp.$1;
					an.target.selector = {};
				}
				if(sel) sel.split('&').forEach(function(fp){
					var kv = fp.split('=');
					frag[kv[0]] = kv[1];
				});
				if(!frag.xywh){
					frag.xywh = this.noreg.frag;
					has_region = false;
					this.noreg.num++;
				}else{
					has_region = true;
				}
				if(!frag.t && an.target.media) frag.t = an.target.media.frag.substr(2);
				an.afrag = "xywh=" + frag.xywh;
				var t = frag.t ? Mut.split_as_num(frag.t) : [0,0];
				this.add(
					Mwa.to_annotorious(an, Manno.osd_src, Geomdim, Mediaurl),
					t[0], t[1] || t[0],
					has_region,
					Miiif.map[Mediaurl] || Mediaurl
				); 
			}
		},
		resolve_deferred: function(oa, idx){
			var usepaint = (Miiif.tfmedia || Miiif.locfmedia || Muib.opts.v.tp) ? true : false;
			["paint", "highlight"].forEach(function(t){
				if(!Mia.defer[t][idx] || Object.keys(Mia.defer[t][idx]).length === 0) return;
				else if(!Mia.current.panzoom && (usepaint || t==="highlight")){
					for(var uri in Mia.defer[t][idx]) Mia.defer[t][idx][uri].forEach(function(tp){
						var mf = {
							"type": "Text",
							"class": t,
							"id": tp.target.source + tp.loc,
							"val": at.gettext(tp)
						};
						Miiif.canvas.set_mf(mf, tp.loc, tp.trange);
						if(Mia.cinfo[uri].adjust){
							for(var i=0; i<4; i++) mf.pos[i] *= Mia.cinfo[uri].adjust;
						}
						Mut.prepare_obj(Mia.cinfo[uri], "mf");
						Mut.add_array(Mia.cinfo[uri].mf, uri, mf);
					});
				}else{
					for(var uri in Mia.defer[t][idx]) Mut.concat_array(oa, uri, Mia.defer[t][idx][uri]); 
				}
				Mia.defer[t][idx] = {};
			});
		},
		setup_media: function(){
			var ci;
			for(var url in Mia.cinfo){
				ci = Mia.cinfo[url];
				Mut.prepare_obj(this.repo, url);
				Mut.prepare_obj(this.repo[url], "st_media");
				Mut.prepare_obj(this.repo[url], "ed_media");
				Mut.prepare_obj(this.repo[url], "durs");
				add_media(url, ci.offset, this);
			}
			function add_media(url, ofst, that){
				var urepo = that.repo[url];
				if(ci.layer) ci.layer.forEach(function(o){
					if(o.done) return;
					if(o.trange){
						var id = Mav.annot.get_tileid(o, ci), 
						st = o.trange[0],
						ed = o.trange[1];
						Mut.add_array(urepo.st_media, st, {"id":id, "end":ed});
						Mut.add_array(urepo.ed_media, ed, id);
						add_durs(urepo.durs, st, ed, id, "image", null);
					}
					o.done = true;
				});
				if(ci.mf) for(var murl in ci.mf) ci.mf[murl].forEach(function(o){
					if(o.done) return;
					var id = that.gen_id(murl, o), st, ed, cvdur;
					if(o.t){
						st = o.t[0];
						ed = o.t[1];
						Mut.add_array(urepo.ed_media, ed, id);
					}else{
						st = 0;
						ed = ci.duration;
					}
					cvdur = ed - st;
					var bst, bdur, rate;
					if(o.bodyt){
						bst = o.bodyt[0];
						bdur = o.bodyt[1] - o.bodyt[0];
						if(bdur != cvdur){
							rate = time_mode(id, o, st, bdur, cvdur, bst, urepo);
						}
					}else{
						bst = 0;
					}
					var stobj = {"id": id, "end": ed, "bst": bst};
					if(rate) stobj.rate = rate;
					Mut.add_array(urepo.st_media, st, stobj);
					add_durs(urepo.durs, st, ed, id, o.type, bst);
					o.done = true;
				});
			}
			function add_durs(durs, st, ed, id, type, bst){
				if(!durs[st]) durs[st] = {};
				Mut.add_array(durs[st], ed, {"id": id, "label": Mut.filename(id), "type": type, "bst": bst});;
			}
			function time_mode(id, o, st, bdur, cvdur, bst, urepo){
				switch(o.timeMode){
				case "scale":
					return bdur / cvdur;
				case "loop":
					Mut.prepare_obj(urepo, "trim");
					if(bdur > cvdur) break;
					for(var t=st+bdur,max=st+cvdur; t<max; t+=bdur){
						Mut.add_array(urepo.trim, t, {"id": id, "bst": bst});
					}
					break;
				case "trim":
				default:
					Mut.prepare_obj(urepo, "trim");
					if(bdur > cvdur) break;
					Mut.add_array(urepo.trim, st + bdur, {"id": id, "trim": true});
				}
				return null;
			}
		},
		gen_id: function(base, o){
			return base + (o.type === "Audio" ?
				"" :
				(o.loc || "")
			);
		},
		register: function(keyuri, keys){
			if(!keys) keys = this.repokeys;
			var count = 0;
			if(this.repo[keyuri]) keys.forEach(function(key){
				this[key] = this.repo[keyuri][key] || {};
				if(key.match(/^st/)) count += Object.keys(this[key]).length;
			}, this);
			Mav.clock.current_items = count;
		},
		update_anno: function(newuri, prevuri){
			if(prevuri){
				this.clear_current();
			}else{
				this.setup_media();
			}
			this.register(newuri);
		},
		get_tileid: function(o, ci){
			return o.tile ? o.tid : ci.imgurl || ci.mediaurl;
		},
		prepare_popup: function(){
			var pos = this.noreg.pos;
			this.noreg.pixpos = Mwa.pct2px(pos, Mav.vinfo.dim);
			this.ann_popup = Mut.dom.get(".annotorious-popup")[0];
			Muib.elt.jldarea.style.zIndex = 3;
		},
		set_new: function(an){
			var keyurl = Mav.key_uri();
			if(!(an.has_region = 
				(Mav.cinfo && Mav.cinfo.dim.x) || (Mav.type !== "audio"))){
				Mwa.setup_geometry(an, Mau.annogeom);
			}

			var selend = Mav.state.selstart === Mav.state.selend ? Mav.state.selend + 1 : Mav.state.selend;
			Manno.set_anno_meta(
				an,
				keyurl,
				Mav.cinfo.dim || Mav.vinfo.dim,
				true,
				((an.has_region ? "&" : "") + "t=" + Mav.state.selstart + "," 
				+ (Mav.state.selstart === Mav.state.selend ?
					Mav.state.selend + 1 : Mav.state.selend)
				)
			);
			this.add(an, Mav.state.selstart, Mav.state.selend, an.has_region, keyurl);
			this.register(keyurl, ["start", "end", "durs"]);
			Mav.clock.add_timeline();
			anno.removeAnnotation(an);
			this.clear(an);
			if(Mav.is_paused()) Mav.resume();
			Muib.jld.showbtn();
			if(!an.has_region) this.reset_frags(Mav.state.selstart, Mav.state.selend);
		},
		reset_frags: function(st, ed){
			var frag_range = Object.keys(Manno.frags).sort(Mut.num.asc);
			for(var t=st; t<=ed; t++){
				var tpos = this.set_tpos(t);
				if(Manno.frags[tpos]) delete Manno.frags[tpos];
			}
		},
		set_tpos: function(now){
			return "t" + now;
		},
		add: function(annobj, st, ed, has_region, keyurl){
			if(typeof(has_region) !== "undefined") annobj.has_region = has_region;
			annobj.sted = [st, ed];
			Mut.prepare_obj(this.repo, keyurl);
			Mut.prepare_obj(this.repo[keyurl], "start");
			Mut.prepare_obj(this.repo[keyurl], "end");
			Mut.prepare_obj(this.repo[keyurl], "durs");
			if(this.repo[keyurl].start[st]){
				if(Mav.vinfo.bgtile){
					Mut.prepare_obj(this.repo[keyurl], "auftakt");
					this.repo[keyurl].auftakt[annobj.id] = {map: this.repo[keyurl].start[st][0]};
				}
			}else this.repo[keyurl].start[st] = [];
			this.repo[keyurl].start[st].push(annobj);
			Mut.add_array(this.repo[keyurl].end, ed, annobj);
			this.idx[annobj.id] = annobj;
			Mut.prepare_obj(this.repo[keyurl].durs, st);
			Mut.add_array(this.repo[keyurl].durs[st], ed, {"id": annobj.id, "label":"text annotation", "type":"annot", "anno": annobj});
			
			Mut.add_array(Manno.page, keyurl, annobj);
			if(!this.pre_expose){
				Manno.current.push(annobj);
				if(annobj.has_region) this.clone_popup(annobj);
			}
		},
		clone_popup: function (annobj){
			if(!this.ann_popup) this.prepare_popup();
			var my_popup = this.ann_popup.cloneNode(false);
			var pos = Mwa.ratio2px(annobj, Mav.vinfo.dim);
			my_popup.style.left = pos[0] + "px";
			my_popup.style.top = (pos[1] + pos[3] + 13) + "px";
			my_popup.style.zIndex = 98999;
			my_popup.innerText = annobj.text;
			Mut.dom.append(this.ann_popup.parentNode, my_popup);
			this.clone[annobj.id] = my_popup;
		},
		set_changed: function(delta, an){
			if(delta === -1) this.remove(an);
		},
		remove: function(an){
			var tanno,
			type = ["start", "end"],
			repo = this.repo[an.imgurl];
			for(var i=0; i<2; i++){
				tanno = repo[type[i]][an.sted[i]];
				for(var j=0,n=tanno.length; j<n; j++){
					if(tanno[j] === an){
						delete tanno[j];
						break;
					}
				}
			}
			tanno = repo.durs[an.sted[0]][an.sted[1]];
			for(var j=0,n=tanno.length; j<n; j++){
				if(tanno[j].id === an.id){
					delete tanno[j];
					break;
				}
			}
			delete this.showing[an.id];
			this.register(an.imgurl, ["start", "end", "durs"]);
			Mav.clock.add_timeline();
		},
		clear: function(an){
			if(this.showing[an.id] === undefined){
				return;
			}
			if(!this.pre_expose){
				anno.removeAnnotation(an);
				if(this.showing[an.id] ==="clone") this.clone[an.id].style.opacity = 0;
			}
			delete this.showing[an.id];
		},
		
		clear_current: function(){
			anno.removeAll();
			this.mute.current(true);
		},
		
		expose: function(an, now){
			if(this.showing[an.id] !== undefined){
				return;
			}
			var noreg_an = null;
			this.showing[an.id] = an.has_region;
			if(this.pre_expose){
				if(an.has_region) anno.highlightAnnotation(an);
			}else if(an.has_region){
				anno.addAnnotation(an);
				if(Miiif.tfmedia) anno.highlightAnnotation(an);
				else this.show_clone(an.id);
			}else{
				this.test_overlap(now, 0, an);
				anno.addAnnotation(an);
				noreg_an = an;
			}
			return noreg_an;
		},
		set_rewind: function(t, ready_evt){
			if(!this.state.rewinded){
				if(Miiif.use && Mav.state.initpos){
					Mav.v.currentTime = Mav.state.initpos;
				}
				this.state.rewinded = true;
				return;
			}
			if(t===0 && !ready_evt) anno.removeAll();
			Object.keys(this.showing).forEach(function(anid){
				var an = this.idx[anid];
				if(an.sted[0] > t) this.clear(an);
			}, this);
			if(!ready_evt){
				this.check_now(t);
				Mav.state.lastsec = t;
			}
		},
		check: function(thistime, lasttime){
			for(var now = lasttime + 1; now <= thistime; now++){
				this.check_now(now);
				if(Mav.cinfo.duration && now > Mav.cinfo.duration){
					this.mute.current(false);
					if(Miiif.viewingHint === "auto-advance") Mav.turn_page(Mav.key_uri(), 1);
				}
			}
			if(this.test_showing() === 0){
				anno.highlightAnnotation();
			}
		},
		check_now: function(now){
			var hidetime = now,
			turned = false;
			if(this.end[hidetime] || this.ed_media[hidetime]){
				Mia.current.tpos = this.set_tpos(hidetime);
				if(this.end[hidetime]) this.end[hidetime].forEach(function(an){
					this.clear(an);
					if(!an.has_region) 
					this.test_overlap(now, 1, an);
				}, this);
				if(this.ed_media[hidetime]) this.ed_media[hidetime].forEach(function(id){
					this.showhide_item({"id": id}, 0, hidetime);
				}, this);
			}
			if(this.start[now] || this.st_media[now]){
				Mia.current.tpos = this.set_tpos(now);
				var noreg_an = null;
				if(this.start[now]) this.start[now].forEach(function(an, i){
					noreg_an = this.expose(an, now);
				}, this);
				if(this.st_media[now]) this.st_media[now].forEach(function(o){
					this.showhide_item(o, 1, now);
				}, this);
				if(noreg_an) this.show_noreg_popup(noreg_an);
			}
			if(this.trim && this.trim[now]) this.trim[now].forEach(function(o){
				this.showhide_item(o, 0.5, now);
			}, this);
		},
		showhide_item: function(m, op, now){
			var itemidx = Muib.layers.items.indexOf(m.id);
			if(itemidx === -1){
				if(op === 1) show_av(m, now);
				else if(op === 0.5){
					if(m.trim){
						Mav.melts[m.id].pause();
					}else{
						Mav.melts[m.id].currentTime = m.bst;
					}
				}else this.mute.av(m.id, check_hide(now));
			}else{
				if(op) show_img(m, now, itemidx);
				else this.mute.img(m.id, itemidx, check_hide(now));
			}
			function show_av(m, now){
				if(Mav.melts[m.id] === true){
					return;
				}
				Mav.melts[m.id].style.display = "block";
				if(Mav.melts[m.id].tagName.toLowerCase() === "div") return;
				if(! Mav.clock.seeked){
					if(now !== m.bst){
						Mav.melts[m.id].currentTime = m.bst;
					}else if(now === 0){
						Mav.melts[m.id].currentTime = 0;
					}
				}
				if(m.rate){
					Mav.melts[m.id].playbackRate = m.rate;
				}else if(Mav.melts[m.id].playbackRate !== 1){
					Mav.melts[m.id].playbackRate = 1;
				}
				if(Mav.clock.playing){
					Mav.melts[m.id].play();
				}
				Mav.annot.up_media[m.id] = [now, m.end, m.bst];
			}
			function show_img(m, now, itemidx){
				Mav.annot.up_media[m.id] = [now, m.end, null];
				Muib.layers.setopacity(1, itemidx);
			}
			function check_hide(now){
				if(now === Mav.cinfo.duration) return false;
				else return true;
			}
		},
		mute: {
			current: function(to_hide){
				Object.keys(Mav.annot.up_media).forEach(function(id){
					var itemidx = Muib.layers.items.indexOf(id);
					if(itemidx === -1) this.av(id, to_hide);
					else this.img(id, itemidx, to_hide);
				}, this);
			},
			
			av: function(id, to_hide){
				if(to_hide){
					Mav.melts[id].style.display = "none";
					delete Mav.annot.up_media[id];
				}
				if(Mav.clock.playing && Mav.melts[id].tagName.toLowerCase() !== "div") Mav.melts[id].pause();
			},
			img: function(id, itemidx, to_hide){
				if(to_hide) delete Mav.annot.up_media[id];
				Muib.layers.setopacity(0, itemidx);
			}
		},
		show_noreg_popup: function(an){
			if(Mav.type ==="audio"){
				Mav.char_timer = "";
			}else{
				Mav.char_timer = "&#x1F551; ";
				var box = Mut.dom.get(".annotorious-ol-boxmarker-outer");
				for(var i=0,n=box.length; i<n; i++){
					if(box[i].style.top === this.noreg.pixpos[1]+"px" && 
						box[i].style.left === this.noreg.pixpos[0]+"px")
					box[i].style.opacity = 0;
				}
			}
			anno.highlightAnnotation(an);
		},
		prepare_auftakt: function(){
			var area = {};
			for(var id in this.auftakt){
				area[this.pix_area(this.auftakt[id].map)] = id;
			}
			var box = Mut.dom.get(".annotorious-ol-boxmarker-outer");
			for(var i=0,n=box.length; i<n; i++){
				var bbx = box[i].getBoundingClientRect(),
				posstr = Math.round(bbx.left) + "," + Math.round(bbx.top) + "," + Math.round(bbx.width) + "," + Math.round(bbx.height);
				if(area[posstr]) this.auftakt[area[posstr]].box = box[i];
			}
			
		},
		pix_area: function(an){
			return Mwa.ratio2px(an, viewer.source.dimensions).slice(0,4).join(",");
		},
		set_popup_pos: function(popup, pixpos){
			popup.style.left = pixpos[0] + "px";
			popup.style.top = (pixpos[1] + pixpos[3] + 13) + "px";
		},
		test_overlap: function(now, deleted, an){
			if(this.test_showing() + deleted > 1){
				if(!Manno.frags[Mia.current.tpos]){
					Manno.frags[Mia.current.tpos] = this.get_noregion_annot();
				}
				if(deleted && !an.has_region){//Mav.type === "audio"
					anno.removeAll();
					var topanno = this.idx[Manno.frags[Mia.current.tpos][0]];
					anno.addAnnotation(topanno);
					Manno.multi_annot(topanno, Manno.frags[Mia.current.tpos]);
					this.show_noreg_popup(topanno);
				}
			}
		},
		get_noregion_annot: function(){
			var res = [];
			if(Mav.vinfo.bgtile) return res;
			for(var id in this.showing){
				if(this.showing[id] === false) res.push(id);
				else this.show_clone(id);
			}
			return res;
		},
		test_showing: function(){
			return Object.keys(this.showing).length;
		},
		show_clone: function(anid){
			this.clone[anid].style.opacity = 1;
			this.showing[anid] = "clone";
		},
		get: function(type){
			if(Mav.vinfo.bgtile && Mav.type === "audio" && !Mav.clock.use){
				var uri = Mav.cinfo ? Mav.cinfo.imgurl : Mav.vinfo.url,
				amap = {}, annojson = Manno.prepare_get_anno(amap),
				wajson = Mwa.getanno(true, annojson, Mpj.uribase, Mav.vinfo.dim, "Image");
				wajson["@graph"].forEach(function(waj){
					var id = waj.id, tfrag = "#t=" + amap[id].sted.join(",");
					waj.body = [{id: uri + tfrag, type: "Audio"}];
					if(waj.bodyValue){
						waj.body.push({value: waj.bodyValue, type: "TextualBody"});
						delete waj.bodyValue;
					}
				});
				return wajson;
			}else{
				var anobj = [];
				for(var url in this.repo){
					for(var st in this.repo[url].start){
						anobj = anobj.concat(this.repo[url].start[st]);
					}
				}
				return Mwa.getanno(
					!Miiif.use || !Mav.cinfo.dim || !Mav.cinfo.dim.x,
					anobj,
					Mpj.uribase,
					Mav.cinfo.dim || Mav.vinfo.dim
				);
			}
		}
	},

	clock: {
		use: false,
		current: 0,
		now: 0,
		delay: 250,
		end: 0,
		end_tf: "0:00",
		playing: false,
		timer: null,
		container: null,
		btn: null,
		bar: null,
		disp: null,
		tl: null,
		seeked: false,
		current_items: 0,
		last_st: 0,
		setup: function(){
			if(!this.use) return;
			var dur = Mav.cinfo.duration;
			this.end = dur * 1000;
			this.end_tf = this.t_format(dur);
			this.current = 0;
			this.last_st = 0;
			if(this.container){
				this.bar.setAttribute("max", dur);
				this.set_disp(0);
				this.btn.innerText = "start";
				this.current = 0;
				this.add_timeline(dur);
				return; 
			}
			this.container = Mut.dom.elt("div", "", [["id", "clock"]]);
			this.btn = Mut.dom.elt("button", "start");
			this.btn.onclick = Mav.clock.btn_action;
			this.btn.style.width = "80px";
			this.btn.style.marginRight = "5px";
			this.disp = Mut.dom.elt("span", "0:00 / "+this.end_tf, [["class", "disp"]]);
			this.disp.style.width = "90px";
			this.disp.style.marginRight = "3px";
			this.bar = Mut.dom.elt("input","",[["type", "range"], ["min", 0], ["max", dur], ["step", 0.1], ["value", 0]]);
			this.bar.addEventListener("change", function(ev) {
				Mav.clock.update(Math.floor(ev.target.value));
			});
			var timeline = Mut.dom.elt("div", "", [["id", "timeline"]]);
			timeline.style.width = (Muib.elt.osdv.clientWidth - (80 + 90 + 15)) + "px";
			this.tl = Mut.dom.elt("div");
			Mut.dom.append(timeline, [this.bar, this.tl]);
			Mut.dom.append(this.container, [this.btn, this.disp, timeline]);
			Muib.elt.maindiv.insertBefore(this.container, Muib.elt.imgdsc);
			Muib.main_msg("done clock setup");
			
		},
		add_timeline: function(Dur){
			if(!this.tl) return false;
			if(!Dur) Dur = Mav.cinfo.duration;
			if(Mav.clock.tl.firstChild) Mav.clock.tl.innerHTML = "";
			var count = 0, cvdheight;
			Object.keys(Mav.annot.durs).sort(Mut.num.nasc).forEach(function(st){
				Object.keys(Mav.annot.durs[st]).sort(Mut.num.nasc).forEach(function(ed){
					Mav.annot.durs[st][ed].forEach(function(obj){
						var div = Mut.dom.elt("div"), 
						sp = Mut.dom.elt("span", "", [["title", st + "-" + ed + " (" + obj.label + ")"], ["class", obj.type]]);
						sp.style.width = ((ed - st)*100 / Dur) + "%";
						sp.style.marginLeft = (st*100 / Dur) + "%";
						div.appendChild(sp);
						Mav.clock.tl.appendChild(div);
						count++;
					});
				});
			});
		},
		start: function(){
			var now = 0;
			if(Mav.clock.seeked){
				now = Mav.state.lastsec;
			}
			this.playing = true;
			Mav.clock.set_disp(now);
			this.timer = window.setInterval(Mav.clock.update, Mav.clock.delay);
			Mav.annot.check(now, -1);
			Mav.clock.seeked = false;
			Mav.clock.btn.innerText = "pause";
		},
		update: function(now){
			var bartime;
			if(now !== undefined){
				Mav.clock.current = now * 1000;
				bartime = now;
			}else{
				Mav.clock.current += Mav.clock.delay;
				bartime = Mav.clock.current / 1000;
				now = Math.floor(bartime);
			}
			Mav.clock.now = now;
			if(Mav.clock.current > Mav.clock.end){
				window.clearInterval(Mav.clock.timer);
				Mav.annot.mute.current(false);
				if(Miiif.viewingHint === "auto-advance"){
					Mav.turn_page(Mav.key_uri(), 1);
				}else{
					Mav.clock.btn.innerText = "replay";
				}
			}else{
				Mav.clock.bar.value = bartime;
				if(now !== Mav.state.lastsec){
					var lastsec = Mav.state.lastsec;
					Mav.annot.check(now, Mav.state.lastsec);
					Mav.clock.set_disp(now);
					if(now < lastsec) Mav.clock.test_seek(now, 0, lastsec);
					else if(now - lastsec > 1) Mav.clock.test_seek(now, Mav.clock.last_st, now);
				}
				Mav.state.lastsec = now;
			}
			
		},
		pause: function(){
			Mav.clock.playing = false;
			window.clearInterval(this.timer);
			for(var id in Mav.annot.up_media){
				if(Muib.layers.items.indexOf(id) === -1) Mav.melts[id].pause();
			}
			Mav.clock.btn.innerText = "resume";
		},
		resume: function(){
			Mav.clock.playing = true;
			this.timer = window.setInterval(this.update, this.delay);
			Mav.clock.seeked = false;
			for(var id in Mav.annot.up_media){
				if(Muib.layers.items.indexOf(id) === -1) Mav.melts[id].play();
			}
			Mav.clock.btn.innerText = "pause";
		},
		btn_action: function(e){
			var label = e.target.firstChild;
			switch(label.data){
			case "replay":
				Mav.state.lastsec = Mav.clock.current = 0;
				Mav.annot.clear_current();
				Mav.annot.mute.current();
			case "start":
				Mav.clock.start();
				break;
			case "pause":
				Mav.clock.pause();
				break;
			case "resume":
				Mav.clock.resume();
				break;
			}
		},
		test_seek: function(now, from, to){
			var hide = false, dont_hide = [];
			for(var st in Mav.annot.durs){
				if(st < from) continue;
				if(st > to) break;
				this.last_st = Number(st);
				for(var ed in Mav.annot.durs[st]){
					hide = (now < st || now > ed);
					Mav.annot.durs[st][ed].forEach(function(m){
						if(hide && dont_hide.indexOf(m.id)===-1){
							if(m.type === "annot"){
								Mav.annot.clear(m.anno);
								if(!m.anno.has_region) Mav.annot.test_overlap(now, 1, m.anno);
							}else if(Mav.annot.up_media[m.id]){
								Mav.annot.showhide_item(m, 0);
								if(now < st) this.seek_media(m.id, now, st, m.bst);
							}
						}else if(!hide){
							if(m.type === "annot"){
								Mav.annot.expose(m.anno, now);
							}else{
								this.seek_media(m.id, now, st, m.bst);
								if(! Mav.annot.up_media[m.id]) Mav.annot.showhide_item(m, 1, now);
							}
							dont_hide.push(m.id);
						}
					}, this);
				}
			}
			
		},
		
		seek_media: function(id, now, st, bst){
			if(Muib.layers.items.indexOf(id) !== -1) return;
			if(!st) st = Mav.annot.up_media[id][0];
			if(Muib.layers.items.indexOf(id) === -1)
			Mav.melts[id].currentTime = now - st + (bst || 0);
			this.seeked = true;//再生ではなく命令でシーク
		},
		set_disp: function(now){
			Mav.clock.disp.innerText = Mav.clock.t_format(now) + " / " + Mav.clock.end_tf;
		},
		t_format: function(t){
			var m = Math.floor(t / 60), s = t % 60;
			return m + ":" + (s < 10 ? "0": "") + Math.floor(s);
		}

	},
	start: function(){
		if(Mav.clock.use) Mav.clock.start();
		else Mav.v.play();
	},
	pause: function(){
		if(Mav.clock.use) Mav.clock.pause();
		else Mav.v.pause();
	},
	resume: function(){
		if(Mav.clock.use) Mav.clock.resume();
		else Mav.v.play();
	},
	is_paused: function(){
		return Mav.clock.use ?
		! Mav.clock.playing :
		Mav.v.paused;
	},
	loaded: function(){
	},
	ctrls: {
		use: false,
		set: function(tf){
			for(var url in Mav.melts){
				Mav.melts[url].controls = tf;
			}
			this.use = tf;
		},
		toggle: function(){
			this.set(! this.use);
		}
	}
};


var Mvd = {
	init: function(vurl){
		Mav.start_pos(vurl);
		if(Mav.state.tfrag) vurl += "#t=" + Mav.state.tfrag;
		var info = Mav.cvurl ? Mia.cinfo[Mav.cvurl].mf[Mav.vinfo.url][0] : {"type": "Video"};
		Mav.gen_elt(Mav.vinfo.url, Mav.vinfo.url, info, true);
		Muib.main_msg("loading video..." + Mut.filename(vurl));
		Mav.setup_elt();
		Mav.map_handlers("Video");
		Mav.set_media_handlers();
		Mav.set_annotroious_handlers();
	}
};


var Mau = {
	opts: {dim: {x: 500, y: 250}, bghex: "6fa1c0", popw: "350px"},
	annopos: [8, 0, 5, 10],
	annogeom: [],
	msg_state: true,
	init: function(aurl){
		Mav.start_pos(aurl);
		if(Mav.state.tfrag) aurl += "#t=" + Mav.state.tfrag;
		var info = Mav.cvurl ? Mia.cinfo[Mav.cvurl].mf[Mav.vinfo.url][0] : {"type": "Audio"};
		Mav.gen_elt(Mav.vinfo.url, Mav.vinfo.url, info, true);
		if(Muib.tindex.state.use) this.opts.dim.y = 400;
		if(!Mav.vinfo.bgtile) Mav.opts.minw = this.opts.dim.x + "px";
		this.set_height(Mav.v);
		Mav.annot.noreg.pos = this.annopos;
		Muib.main_msg("loading audio...");
		Mav.setup_elt();
		Mav.map_handlers("Audio");
		Mav.set_media_handlers();
		Mav.set_annotroious_handlers();
		if(!Mav.vinfo.bgtile) this.set_more();
	},
	set_more: function(){
		Muib.elt.osd_cntner.addEventListener("mouseover", function(){
			if(Mau.msg_state){
				Muib.fadeio(Muib.elt.msg, 2000, 1, 1, 0.5);
				Mau.msg_state = false;
			}
		});
	},
	set_height: function(elt){
		if(!Mav.vinfo.bgtile) elt.style.height = this.opts.dim.y + "px";
	},
	set_new: function(annot){
		Mwa.setup_geometry(annot, this.annogeom);
		annot.has_region = Mav.vinfo.bgtile;
		Mav.annot.set_new(annot);
	},
	get_annotation: function(){
		return Mwa.getanno(true, Manno.current, Mpj.uribase, Mav.vinfo.dim, "Audio");
	},
	set_audio_msg: function(){
		Muib.main_msg(Muib.env.lang === "ja" ?
			"左上□をクリックし、ドラッグ開始～終了期間を対象に注釈できます。<br/>（選択範囲の座標は関係しません）":
			"Click upper-left □. Drag start-end duration will be annot range.<br/>(coord of selected region is irrelevant)", false);
		Muib.set_status("auto");
	}
};

var Mytb = {
	player: null,
	vid: null,
	dim: {x: 800, y: 450},
	c: {NO_KEEP: 0, KEEP: 1, SEEK_WAIT: 2},
	init: function(vurl){
		Mav.start_pos(vurl);
		var uparam = vurl.match(/(\?v=|youtu.be\/)(.*)$/);
		this.vid = uparam[2];
		Muib.elt.media = Mav.v = Mut.dom.elt("div", "", [["id", "player"]]);
		Mav.setup_elt(); 
		Mut.dom.append(Mut.dom.get("head")[0], Mut.dom.elt("script", "", [["src", "https://www.youtube.com/iframe_api"]]));
		Mav.map_handlers("Video");
		Mav.resume = Mytb.resume;
		this.set_annotroious_handlers();
	},
	onPlayerReady: function(ev) {
		Muib.elt.media = Mav.v = Mut.dom.get(Mav.v.id, "id");
		Mav.dimension_and_annot(ev.target.a);
		Mytb.player.setVolume(Mav.opts.volume * 100);
		var param = {videoId: Mytb.vid};
		if(Mav.state.initpos){
			param.startSeconds = Mav.state.initpos;
			if(Mav.state.endpos) param.endSeconds = Mav.state.endpos;
		}
		Mav.annot.set_rewind(Mytb.sec_now(), true);
		if(Mav.opts.autostart) Mytb.player.loadVideoById(param);
		else Mytb.player.cueVideoById(param);
	},
	onPlayerStateChange: function(ev) {
		if(Mav.state.keeper === Mytb.c.SEEK_WAIT){
			if(ev.data === YT.PlayerState.PLAYING){
				Mav.state.keeper = Mytb.c.NO_KEEP;
				Mytb.pause();
				Mav.state.lastsec = Mytb.sec_now();
				Mav.annot.check(Mav.state.lastsec, Mav.state.lastsec-1);
			}
		}else if(Mav.state.keeper === Mytb.c.KEEP || ev.data === YT.PlayerState.PLAYING) {
			Mav.state.keeper = Mytb.c.KEEP;
			Mytb.watch_state(ev);
		}else if(ev.data === YT.PlayerState.PAUSED){
			Mav.state.keeper = Mytb.c.NO_KEEP;
		}else if(ev.data === YT.PlayerState.ENDED){
			Mytb.pause();
			Mav.state.keeper = Mytb.c.NO_KEEP;
		}
	},
	watch_state: function(ev){
		var now;
		if(ev.data === YT.PlayerState.PAUSED){
			Mav.state.keeper = Mytb.c.NO_KEEP;
		}else if(ev.data === YT.PlayerState.ENDED){
			Mav.state.lastsec = 0;
			Mav.state.keeper = Mytb.c.NO_KEEP;
		}
		time_keeper();
		sid = setInterval(function(){
			time_keeper();
			if(Mav.state.keeper === Mytb.c.NO_KEEP) clearInterval(sid);
		}, 500);
		function time_keeper(){
			if((now = Mytb.sec_now()) > Mav.state.lastsec){
				Mav.annot.check(now, Mav.state.lastsec);
				Mav.state.lastsec = now;
			}else if(now < Mav.state.lastsec){
				Mav.annot.set_rewind(now);
				Mav.annot.check(now, now-1);
				Mav.state.lastsec = now;
			}
		}
	},
	sec_now: function() {
		return Math.floor(Mytb.player.getCurrentTime());
	},
	set_annotroious_handlers: function() {
		anno.addHandler("onSelectionStarted", function(ev){
			Mav.state.selstart = Mytb.sec_now();
		});
		anno.addHandler("onSelectionCompleted", function(ev){
			Mav.state.selend = Mytb.sec_now();
			Mytb.pause();
		});
		anno.addHandler("onSelectionCanceled", function(e){
			Mytb.resume();
		});
		Mav.setup_annobox();
	},
	pause: function(){
		Mytb.player.pauseVideo();
	},
	resume: function(){
		Mytb.player.playVideo();
	}
};

function onYouTubeIframeAPIReady() {
	Mytb.player = new YT.Player('player', {
		height: Mytb.dim.y,
		width: Mytb.dim.x,
		events: {
			'onReady': Mytb.onPlayerReady,
			'onStateChange': Mytb.onPlayerStateChange
		},
		playerVars: {
			rel: 0
		}
	});
}
