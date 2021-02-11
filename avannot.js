/// avannot.js by KANZAKI, Masahide. ver 2.7, 2018-06-26. MIT license.
"use strict";
var Mia, Mpj, Manno, Muib, Miiif, Mut, Mwa, at;
var Mav = {
	avelt: null,
	useOsdvOverlay: true,
	state: {lastsec: 0, selstart: 0, selend: 0, initpos: 0, current_pos: 0, tfrag: false, keeper: 0, dim_done: false, cvdim: true, audiothubm: false, volume_done: false},
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
	subcid: 1,
	
	init: function(url, type, tile_len){
		this.type = type;
		Manno.use_avanno = true;
		this.muris = Object.keys(Miiif.medias);
		if(Miiif.use){
			this.cvurl = Miiif.cvs.ullist[Mia.opts.iniOsdPos];
			this.cinfo = Mia.cinfo[this.cvurl];
			this.vinfo.bgtile = 
			Miiif.cvs.ullist.length > 1 ? true :
			(Miiif.cvs.full_imgs ? true : false) ;
		}else if(tile_len) this.vinfo.bgtile = true;
		
		if((type === "simple") ||
			Miiif.max_cvmedia > 1 ||
			(Miiif.cvs.ullist.length > 1 && !Mia.jsource.structures)
		){
			this.init_ccm(type);
		}else{
			this.opts.ctrls = true;
			switch(type){
			case "youtube":
				Mytb.init(url); break;
			case "audio":
			case "sound":
				Mau.init(url); break;
			case "video":
			default:
				Mvd.init(url);
			}
		}
		this.set_region_info();
	},
	init_ccm: function(type){
		if(Miiif.cvs.ullist.length > 1) this.multicv = true;
		this.setup_osdcnvs();
		this.vinfo.dim = {x: Mia.elt.osdv.clientWidth, y: Mia.elt.osdv.clientHeight};
		if(!this.vinfo.bgtile) this.set_filler();
		this.map_handlers(type);
		this.set_annotroious_handlers();
		Mav.clock.use = true;
		Mav.clock.setup();

		if(this.multicv) this.setup_cvindex();
		
	},
	start_pos: function(vurl){
		this.vinfo.url = vurl.replace(/#[^#]+$/, "");
		var keyuri = Mav.key_uri(),
		ci = Mia.cinfo[keyuri];
		if(Mia.opts.v.t){
			if(Mia.opts.v.t === "auto"){
				this.opts.autopos = true;
			}else{
				var trange = Mia.opts.v.t.split(',');
				this.state.initpos = Math.floor(trange[0]);
				if(trange[1]) Mav.state.endpos = Math.floor(trange[1]);
				this.state.tfrag = Mia.opts.v.t;
			}
		}else if(ci && ci.duration){
			if(ci.mf && ci.mf[this.vinfo.url][0].body_t) this.state.initpos = ci.mf[this.vinfo.url][0].body_t[0];
			if(ci.timeMode && ci.timeMode === "trim"){
				this.state.tfrag = "0," + ci.duration;
			}
		}
	},
	setup_cvindex: function(){
		if(!Mia.elt.tindex) Mia.tindex.prepare(Mia.osdv, true);
		Miiif.cvs.ullist.forEach(function(u, i){
			if(!Mia.cinfo[u].label) Mia.cinfo[u].label = "Canvas " + Number(i+1);
		});
		Mia.tindex.setup({});
		Mia.tindex.set_current_li(0);
	},
	set_media_handlers: function(){
		this.avelt.addEventListener("load", function(ev) {
			console.log("loaded");
			Muib.appb.set_msg("done load media");
		}, false);
		this.avelt.addEventListener("canplay", function(ev) {
			if(!Mav.state.dim_done){
				Mav.avelt.volume = Mav.opts.volume;
				Mav.state.volume_done = true;
			}
			Mav.dimension_and_annot(ev.target);
			Mav.annot.set_rewind(Mav.sec_now(), true);
			if(Mav.opts.autostart) Mav.avelt.play();
		}, false);
		this.avelt.addEventListener("timeupdate", function(ev) {
			var now;
			if((now = Mav.sec_now()) > Mav.state.lastsec){
				Mav.annot.check(now, Mav.state.lastsec);
				Mav.state.lastsec = now;
			}else if(now < Mav.state.lastsec){
				Mav.annot.set_rewind(now, false);
			}
		}, false);
		this.avelt.addEventListener("pause", function(ev) {
			if(Mav.touchplay) Mav.touchplay.textContent = "play";
			Mav.clock.playing = false;
		}, false);
		this.avelt.addEventListener("play", function(ev) {
			if(Mav.touchplay) Mav.touchplay.textContent = "pause";
			Mav.set_current_li();
			Mav.clock.playing = true;
		}, false);
		this.avelt.addEventListener("ended", function(ev) {
			Mav.check_autoturn();
		}, false);
		this.avelt.addEventListener("error", function(ev) {
			Muib.appb.set_status("auto");
			console.log(ev);
			Muib.appb.set_msg("media load error");
			if(Mav.type === "audio") Mia.elt.msg.style.fontSize = "100%";
		}, false);
		
	},
	set_annotroious_handlers: function() {
		Mwa.antrs.addHandler("onSelectionStarted", function(ev){
			Mav.state.selstart = Mav.sec_now();
		});
		Mwa.antrs.addHandler("onSelectionCompleted", function(ev){
			Mav.state.selend = Mav.sec_now();
			Mav.pause();
		});
		Mwa.antrs.addHandler("onSelectionCanceled", function(e){
			Mav.resume();
		});
		this.setup_annobox();
	},
	setup_annobox: function(){
		var antboxpfx = ".noregion " + Mia.opts.antparam.boxpfx;
		var boxsel = [];
		["outer", "inner"].forEach(function(io){boxsel.push(antboxpfx+io); }); 
		Mia.opts.set_style(boxsel.join(",") + "{border-color:#" + Mau.opts.bghex + " !important}", false);
		Mwa.antrs.addHandler("onMouseOverAnnotation", function(an){
			if(Mav.annot.showing[an.id] && Mav.annot.showing[an.id] === "clone") Mav.annot.clone[an.id].style.opacity = 0;
		});
		Mia.opts.set_style("border_color:yellow;", true);
	},
	map_handlers: function(type){
		Manno.set_changed = function(delta, an){Mav.annot.set_changed(delta, an);};
		Manno.get_annotation = function(){return Mav.annot.get(type);};
		Mia.key_uri = function(){return Mav.key_uri();};
		Manno.set_new = function(an){Mav.annot.set_new(an);};
	},
	check_autoturn: function(){
		if(Miiif.vhint === "auto-advance"){
			Mav.turn_page(Mav.key_uri(), 1);
			return true;
		}else{
			return false;
		}
	},
	

	setup_page_media: function(url, stepfade, from_subcanvas){
		var cinfo = Mia.cinfo[url];
		if(!cinfo) return;
		if(cinfo.mf) for(var murl in cinfo.mf){
			cinfo.mf[murl].forEach(function(mfobj){
				var id = Mav.annot.gen_id(murl, mfobj),
				minfo = Mav.annot.all_medias[id];
				if(!Mav.melts[id]){
					if(!Mav.clock.use && Mav.type){
						Mav.melts[id] = true;
					}else{
						this.gen_elt(id, murl, mfobj, false, from_subcanvas ? url : null);
						if(mfobj.type === "ThreeD") return;
						else if((!mfobj.t || mfobj.t[0] === 0) && mfobj.class !== "highlight") Mav.melts[id].style.display = "block";
					}
				}
				if(mfobj.type !== "Canvas" && minfo.rect){
					if(!minfo.is_overlay) Mia.osdv.viewer.addOverlay(Mav.melts[id], minfo.rect);
				}else if(typeof(Mav.melts[id]) === "object"){
					if(!Mav.melts[id].parentNode) Mia.osdv.insert_element(Mav.melts[id]);
				}
			}, this);
		}
		var numcv = Miiif.cvs.ullist.length,
		disp = cinfo.label || (numcv > 1 ? "Canvas " + (Miiif.cvs.ullist.indexOf(url) + 1) + "/" + numcv : "");
		if(disp) Muib.update_page.imgdesc(url, disp, stepfade);
		if(this.avelt && !this.state.volume_done){
			Mav.avelt.volume = Mav.opts.volume;
			Mav.state.volume_done = true;
		}
	},
	turn_page: function(url, pos_delta){
		var pos = Miiif.cvs.ullist.indexOf(url) + pos_delta,
		newuri = pos_delta ? Miiif.cvs.ullist[pos] : url;
		this.state.current_pos = pos;
		if(!newuri){
		}else{
			if(Miiif.max_cvmedia === 1) this.check_new_vurl(Mia.cinfo[newuri].mediaurl);
			if(Mia.tindex.state.use) Mia.tindex.set_current_li(pos);
			this.set_newpage(newuri, this.cvurl, false, 0, pos);
			this.start();
		}
	},
	set_current_li: function(){
		if(Mia.tindex.state.use) Mia.tindex.set_current_li(this.state.current_pos);
	},
	check_new_vurl: function(newvurl){
		if(newvurl !== Mav.vinfo.url){
			Mav.vinfo.url = newvurl;
			Mav.avelt.src = newvurl;
		}
	},
	set_newpage: function(newuri, prevuri, from_tindex, now, pos){
		if(!newuri) console.log("new uri not defined");
		this.cvurl = newuri;
		this.cinfo = Mia.cinfo[newuri];
		var stepfade, mviewer = Mia.osdv.viewer;
		if(Mia.env.numTiles > 1 || Miiif.cvs.ullist.length > 1){
			mviewer.goToPage(Mia.get_pos(pos));
			Mia.layers.items = [];
			stepfade = false;
		}else{
			Mia.proc_loaded(null, newuri);
			stepfade = false;//true;
			if(Mia.tindex.state.use && !from_tindex) Mia.tindex.set_current_li(pos);
		}
		Mav.annot.update_page_anno(newuri, prevuri);
		
		if(Mav.annot.playing.length){
			Mav.annot.playing.forEach(function(id){
				this.melts[id].pause();
			}, this);
		}
		Mav.annot.playing = [];
		
		if(this.state.audiothubm) update_audio_thumb(this.cinfo);
		Mav.clock.setup();
		if(Mav.clock.timer) window.clearInterval(Mav.clock.timer);
		this.setup_page_media(newuri, stepfade, false);
		this.set_region_info();
		if(now !== undefined && Mav.clock.use){
			Mav.clock.playing = false;
			this.state.lastsec = -2;
			Mav.clock.update(now);
		}
		
		function update_audio_thumb(cinfo){
			if(cinfo.thumbnail){
				var thumb = mviewer.world.getItemAt(1);
				if(thumb) mviewer.world.removeItem(thumb);
				mviewer.addSimpleImage({url: cinfo.thumbnail});
			}
		}
	},

	
	
	setup_elt: function(){
		this.set_elt_size(this.avelt);
		this.setup_osdcnvs();
		Mia.elt.osd_cntner.insertBefore(this.avelt, Mia.osdv.viewer.buttons.element.parentNode.parentNode);

		if(Mia.env.is_touch_dev){
			if(Mav.type !== "youtube") Mav.avelt.load();
			add_playbtn();
		}
		function add_playbtn(){
			Mav.touchplay = Mut.dom.elt("button", "play");
			Mav.touchplay.onclick = function(e){
				var label = e.target.firstChild;
				if(label.data === "play"){
					Mav.avelt.play();
					label.data = "pause";
				}else{
					Mav.avelt.pause();
					label.data = "play";
				}
			};
			Mut.dom.append(Mia.elt.jldctrl, [" ", Mav.touchplay]);
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
		Mia.elt.osd_cntner = Mut.dom.get(".openseadragon-container")[0];
		Mia.elt.osd_cntner.style.overflow = "visible";
		Mia.elt.osd_cnvs = Mia.elt.osd_cntner.firstChild;
		Mia.elt.osd_cnvs.style.overflow = "visible";
	},

	dimension_and_annot: function(tgelt){
		if(Mav.state.dim_done) return;
		Mav.avelt.style.zIndex = 0;
		if(Mav.vinfo.bgtile) set_current_elt(this);
		set_dimension(this, tgelt);
		Mia.osdv.reset_size(Mav.vinfo.dim, true);
		positions(this);
		Mav.state.lastsec = Mav.state.initpos - 1;
		Mav.state.dim_done = true;
			
		function set_dimension(that, tgelt){
			if(!that.vinfo.bgtile){
				if(tgelt.clientHeight){
					that.vinfo.dim = {x: tgelt.clientWidth, y: tgelt.clientHeight};
				}else if(tgelt.style.height){
					that.vinfo.dim = {x: wh2num(tgelt, "minWidth"), y: wh2num(tgelt, "height")};
				}
				Mia.osdv.viewer.viewport._contentAspectRatio = that.vinfo.dim.x / Mav.vinfo.dim.y;
				that.set_filler();
			}else if(!that.vinfo.dim.x){
				that.vinfo.dim = {x:600, y:400};
				if(Mav.type==="audio") tgelt.style.height = "400px";
			}
				
			if(Miiif.cvs.ullist.length > 1){
				var url = Miiif.cvs.ullist[0];
				Muib.update_page.imgdesc(url, Mia.cinfo[url].label ||
					"Canvas 1/" + Miiif.cvs.ullist.length);
			}
		}
		function wh2num(elt, which){
			return Number(elt.style[which].replace(/px$/, ""));
		}
		function set_current_elt(that){
			if(!Mav.clock.use){
				Mia.elt.imgdsc.style.visibility = "hidden";
				Mia.elt.imgdsc.style.height = (Mia.elt.media.clientHeight - 2) + "px";
				Mia.elt.media.style.width = Mav.vinfo.dim.x + "px";
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
				if(vpos) that.setpos(that.avelt, vpos, true);
				Muib.appb.set_msg("done media setup");
			}
		}
	},
	set_filler: function(dim, fillcolor){
		if(!dim) dim = Mav.vinfo.dim;
		this.vinfo.filler = this.get_filler_url(dim, fillcolor);
		Mia.osdv.viewer.addSimpleImage({url: this.vinfo.filler});
		Mia.cinfo[this.vinfo.filler] = {mediaurl: this.vinfo.url};
		if(Mia.keyuris[0] !== this.vinfo.url) Mia.cinfo[this.vinfo.filler].map = Mia.keyuris[0];
		if(this.type === "audio" && this.cinfo && this.cinfo.thumbnail){
			Mia.osdv.viewer.addSimpleImage({url: Mav.cinfo.thumbnail});
			this.state.audiothubm = true;
		}
		
	},
	get_filler_url: function (dim, fillcolor){
		return "/works/2016/pub/images/filler?x=" + dim.x + 
		"&y=" + dim.y + (fillcolor ? "&c=" + fillcolor : (
			Mav.type === "audio" ? "&c=" + Mau.opts.bghex + "00" : "")); 
	},
	
	
	gen_elt: function(id, murl, mfobj, salone_init, subcanvas_uri){
		var osdv = subcanvas_uri ? check_sub_osdv(subcanvas_uri) : Mia.osdv,
		cinfo = subcanvas_uri ? Mia.cinfo[subcanvas_uri] : Mav.cinfo,
		mviewer = osdv.viewer,
		elt;
		switch(mfobj.type){
		case "Text":
			elt = gen_new_elt(id, "div", mfobj.val, [["class", "text" + mfobj.class]]);
			if(mfobj.class === "paint") elt.onclick = Manno.toggle_textpaint;
			break;
		case "Video":
		case "Audio":
		case "Sound":
			elt = gen_media_elt(id, murl, mfobj, salone_init, this);
			break;
		case "ThreeD":
			Muib.threed.load(murl, mfobj.format, this.melts[subcanvas_uri]);
			return;
		case "Canvas":
			var mi = Mav.annot.all_medias[id];
			if(!mi){//.cvinst
				mi = Mav.annot.all_medias[id] = {"type": "Canvas"};
				mi.cvinst = new Subcanvas(murl, id, cinfo, osdv);
			}
			Mia.cinfo[murl].mavinfo = mi;
			mi.cvinst.osd_setup(mfobj);
			Mav.annot.setup(murl);
			break;
		}
		if(salone_init) return elt;
		if(mfobj.type !== "Canvas") this.append_and_set(id, mfobj, cinfo, osdv, subcanvas_uri ? true : false);
		
		function gen_media_elt(id, murl, mfobj, salone_init, that){
			var attr = mfobj.choice ? [] : [["src", murl]],
			type = mfobj.type.toLowerCase() === "video" ? "video" : "audio";
			if(Mav.opts.ctrls) attr.push(["controls", ""]);
			if(mfobj.vtt) attr.push(["crossorigin", "anonymous"]);
			var elt = gen_new_elt(id, type, "", attr);
			if(!salone_init && !Mav.clock.use){
				that.set_elt_size(elt);
				if(that.type === "audio") Mau.set_height(elt);
			}
			if(mfobj.choice){
				elt.appendChild(gen_src_elt(murl, type, mfobj.format));
				mfobj.choice.id.forEach(function(id, i){
					elt.appendChild(gen_src_elt(id, type, mfobj.choice.format[i]));
				});
			}
			if(mfobj.vtt){
				mfobj.vtt.forEach(function(v, i){elt.appendChild(gen_track_elt(v, i)); });
			}
			if(that.type === "video") elt.onclick = function(e){e.target.controls = !e.target.controls;};
			if(!Mav.avelt) Mia.elt.media = Mav.avelt = elt;//Mav.melts[id];
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
		function check_sub_osdv(subc_uri){
			var ci = Mia.cinfo[subc_uri];
			if(!ci || !ci.cvinst){
				console.error("Unregistered subcanvas", subc_uri);
				return false;
			}else return ci.cvinst.osdv;
		}
		
	},
	
	append_and_set: function(id, mfobj, cinfo, osdv, from_subcanvas){
		Mav.melts[id].style.display = "none";
		if(mfobj.pos) this.set_eltpos(id, mfobj, cinfo, osdv.viewer, from_subcanvas);
	},

	set_eltpos: function(id, mfobj, cinfo, mviewer, from_subcanvas){
		var pos = mfobj.pos,
		minfo = Mav.annot.all_medias[id];
		if(!minfo.orgp) minfo.orgp = mfobj.orgp;
		
		var rect = Muib.tool.pix2viewportRect(mfobj.orgp, cinfo.dim.x);
		minfo.rect = rect;
		if(from_subcanvas){
			mviewer.addOverlay(Mav.melts[id], rect); //|| mfobj.type === "Canvas"
			minfo.is_overlay = true;
		}
		
		
		if(mfobj.type === "Canvas"){
			var mycinfo = minfo.cvinst.cinfo;
			mycinfo.adjust = 1;
			if(!mycinfo.dim.x) mycinfo.dim = {x: pos[2], y: pos[3]};
			if(!cinfo.adjust) cinfo.adjust = Mia.osdv.adjust_dim(cinfo.dim, Mav.vinfo.dim);
			if(mycinfo.has_3d){
				mviewer.addOverlay(Mav.melts[id], rect);
				mycinfo.is_overlay = true;
			}else{
				Mia.osdv.insert_element(Mav.melts[id]);
				for(var i=0; i<4; i++) pos[i] *= cinfo.adjust;
				Mav.setpos(Mav.melts[id], pos, false);
			}
		}
	
	},
	

	
	
	key_uri: function(){
		if(this.cvurl) return this.cvurl;
		else if(!Mia.osdv.viewer.source) return Mia.keyuris[0];
		var su = Mia.osdv.viewer.source.canvas || Mia.osdv.viewer.source.url, 
		imginfo = Mia.cinfo[su];
		return imginfo.map || imginfo.mediaurl || su;
	},
	set_region_info: function(){
		this.state.cvdim = this.type !== "audio" ? true : ((this.cinfo && this.cinfo.dim) ? (this.cinfo.dim.x ? true : false) : false);
		this.toggle_classname(Mia.elt.osd_cntner, "noregion", !this.state.cvdim);
	},
	setpos: function(node, pos, resetMinW){
		node.style.left = pos[0] + "px";
		node.style.top = pos[1] + "px";
		node.style.width = pos[2] + "px";
		node.style.height = pos[3] + "px";
		if(resetMinW) node.style.minWidth = 0;
		else node.style.position = "absolute";
	},
	toggle_classname: function(elt, classname, use){
		var spcname = " " + classname;
		if(use){
			if(!elt.className.match(spcname)) elt.className += " " + classname;
		}else{
			if(elt.className.match("^(.*?)"+spcname)) elt.className = RegExp.$1;
		}
	},
	

	sec_now: function() {
		if(Mav.clock.use) return Mav.clock.now;
		else return Math.floor(this.avelt.currentTime);
	},
	start: function(){
		if(Mav.clock.use) Mav.clock.start();
		else Mav.avelt.play();
	},
	pause: function(){
		if(Mav.clock.use) Mav.clock.pause();
		else Mav.avelt.pause();
	},
	resume: function(){
		if(Mav.clock.use) Mav.clock.resume();
		else Mav.avelt.play();
	},
	is_paused: function(){
		return Mav.clock.use ?
		! Mav.clock.playing :
		Mav.avelt.paused;
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

////////////注釈のハンドリング
Mav.annot = {
	start: {},
	end: {},
	durs: {},
	repo: {},
	repokeys: ["start", "end", "st_media", "ed_media", "durs", "trim", "layers"],
	showing: {},
	showing_region: {},
	playing: [],
	auftakt: {},
	idx: {},
	st_media: {}, 
	ed_media: {}, 
	up_media: {}, 
	range: [],
	layers: [],
	ann_popup: null,
	all_medias: {},
	clone: {},
	pre_expose: false,
	noreg: {pos: [20,0,5,3], frag: "", pixpos: [], num: 0, wrapper: null, testpos: {}},
	state: {
		setup_done: {},
		rewinded: false
	},
	
	setup: function(keyuri){
		var is_subcanvas = false;
		if(keyuri) is_subcanvas = true;
		else keyuri = Mav.key_uri();
		if(this.state.setup_done[keyuri]) return;
		this.state.setup_done[keyuri] = Mia.setup_done = true;
		if(Mav.vinfo.bgtile){
			if(!Miiif.tfmedia){
			}
		}
		if(!Mia.oa || Object.keys(Mia.oa).length === 0){
			if(Mia.cinfo[keyuri] && Mia.cinfo[keyuri].other){
				Miiif.add_other_content(keyuri);
			}else{
				var oa = {};
				this.resolve_deferred(oa, 0);
				if(Object.keys(oa).length){
					if(is_subcanvas) this.do_subcanvas_setup(oa, keyuri);
					else this.do_setup(oa, keyuri);
				}else{
					this.update_page_anno(keyuri, null, is_subcanvas);
					Mav.setup_page_media(keyuri, false, is_subcanvas);
					this.check(Mav.state.initpos, Mav.state.initpos-1);
				}
			}
		}else{
			this.resolve_deferred(Mia.oa, 0);
			if(is_subcanvas) this.do_subcanvas_setup(Mia.oa, keyuri);
			else this.do_setup(Mia.oa, keyuri);
		}
		if(Mav.cinfo.duration) Mav.clock.add_timeline(Mav.cinfo.duration);
	},
	do_setup: function(oa, keyuri){
		this.setup_media(false);
		this.noreg.frag = "percent:" + this.noreg.pos.join(",");
		this.prepare_popup();
		var Mediaurl,
		Offset,
		Cinfo,
		Geomdim;
		for(Mediaurl in oa){
			Cinfo = Mia.cinfo[Mediaurl];
			Geomdim = Cinfo.dim || 
			(Mav.vinfo.bgtile ? Mia.osdv.viewer.source.dimensions : Mav.vinfo.dim);
			oa[Mediaurl].forEach(set_annotorious, this);
		}
		this.update_page_anno(keyuri, null, false, true);
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
				Mav.avelt.src += "#t=" + st;
			}
		}
		
		Mav.setup_page_media(keyuri, false, false);
		
		Muib.anno.jldpanel.showbtn();
		if(Mav.state.keeper !== Mytb.c.SEEK_WAIT){
			this.check(Mav.state.initpos, Mav.state.initpos-1);
		}else if(Mav.opts.autopos){
			this.check(Mav.state.lastsec, Mav.state.lastsec-1);
		}else {
			this.check(Mav.state.initpos, Mav.state.initpos-1);
		}
		function set_annotorious(wan){
			var sel = wan.target.selector ? wan.target.selector.value : null,
			subc_parent = Cinfo.parent_cv,
			frag = {}, has_region;
			if(!sel){
				if(typeof(wan.target) === "string") wan.taget = {id: wan.target};
				if(wan.target.id.match(/#(.*)$/)) sel = RegExp.$1;
				wan.target.selector = {};
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
				has_region = frag.xywh;
			}
			if(!frag.t && wan.target.media) frag.t = wan.target.media.frag.substr(2);
			wan.afrag = "xywh=" + frag.xywh;
			var t = frag.t ? Mut.arr.of_nums(frag.t) : [0,0];
			this.add(
				Mwa.to_annotorious(wan, Manno.osd_src, Geomdim, Mediaurl),
				t[0], t[1] || t[0],
				has_region,
				subc_parent ? Mediaurl : (Miiif.map[Mediaurl] || Mediaurl),
				subc_parent,
				Cinfo
			); 
		}
	},
	do_subcanvas_setup: function(oa, keyuri){
		this.update_page_anno(keyuri, null, true);
		Mav.setup_page_media(keyuri, false, true);
	},
	
	resolve_deferred: function(oa, idx){
		var usepaint = test_overlap(Mia.defer.paint[idx]);
		Object.keys(Mia.defer).forEach(function(mtvn_type){
			if(!Mia.defer[mtvn_type][idx] || Object.keys(Mia.defer[mtvn_type][idx]).length === 0) return;
			else if(mtvn_type==="highlight" || (usepaint && mtvn_type==="paint")){	//
				for(var uri in Mia.defer[mtvn_type][idx]) Mia.defer[mtvn_type][idx][uri].forEach(function(txpt){
					var mf = {
						"type": "Text",
						"class": mtvn_type,
						"id": this.gen_id(txpt.target.source, txpt),
						"val": at.gettext(txpt)
					};
					Canvas.set_mf(null, mf, txpt.loc, txpt.trange);
					Mut.obj.prepare(Mia.cinfo[uri], "mf");
					Mut.arr.add(Mia.cinfo[uri].mf, uri, mf);
					Mut.arr.add(Manno.tp, uri, txpt);
					if(t==="highlight") Mia.tindex.set_data_an_attr(txpt.length, uri);
				}, this);
			}else{
				for(var uri in Mia.defer[mtvn_type][idx]) Mut.arr.append(oa, uri, Mia.defer[mtvn_type][idx][uri]); 
			}
			Mia.defer[mtvn_type][idx] = {};
		}, this);
		
		function test_overlap(painting){
			var defval = (Miiif.tfmedia || Miiif.locfmedia || Mia.opts.v.tp) ? true : false;
			if(!painting || painting.length === 0) return defval;
			for(var uri in painting){
				var loc_count = {};
				for(var i=0, n=painting[uri].length; i<n; i++){
					var an = painting[uri][i];
					if(!loc_count[an.loc]) loc_count[an.loc] = 1;
					else if(loc_count[an.loc]++ > 3){
						console.log("☆will use non painting mode for overlapping annotations");
						return false;
					}
				}
			}
			return defval;
		}
	},
	setup_media: function(from_subcanvas){
		var ci, t_offset, that = this;
		for(var url in Mia.cinfo){
			ci = Mia.cinfo[url];
			if(from_subcanvas && !ci.parent_cv) continue;
			t_offset = (ci.parent_cv && ci.trange) ? ci.trange[0] : 0;
			Mut.obj.prepare(this.repo, url);
			Mut.obj.prepare(this.repo[url], "st_media");
			Mut.obj.prepare(this.repo[url], "ed_media");
			Mut.obj.prepare(this.repo[url], "durs");
			this.repo[url].layers = [];
			add_media(url);
		}
		
		function add_media(url){
			var urepo = that.repo[url];
			if(ci.layer) ci.layer.forEach(function(layer_obj, i){
				if(layer_obj.done) return;
				add_images(urepo, layer_obj, i);
			});
			if(ci.mf) for(var murl in ci.mf) ci.mf[murl].forEach(function(layer_obj){
				if(layer_obj.done) return;
				add_avc(urepo, layer_obj, i, murl);
			});
		}
		function add_images(urepo, layer_obj, i){
			var id = Mav.annot.get_tileid(layer_obj, ci);
			if(layer_obj.trange){
				var
				st = Math.floor(layer_obj.trange[0]) + t_offset, 
				ed = Math.floor(layer_obj.trange[1]) + t_offset;
				if(st === ed) ed++;
				Mut.arr.add(urepo.st_media, st, {"id": id, "end": ed});
				Mut.arr.add(urepo.ed_media, ed, id);
				add_durs(urepo.durs, st, ed, id, "image", null);
				that.all_medias[id] = {"type": "Image", "canvas": url, "parent": ci.parent_cv, "self": layer_obj.tid, "orgp": layer_obj.orgp};
			}
			if(i > 0 || id === ci.imgurl) urepo.layers.push(id);
			
			layer_obj.done = true;
		}
		function add_avc(urepo, layer_obj, i, murl){
			var id = that.gen_id(murl, layer_obj), st, ed, cvdur;
			if(layer_obj.t){
				st = Math.floor(layer_obj.t[0]) + t_offset;
				ed = Math.floor(layer_obj.t[1]) + t_offset;
				Mut.arr.add(urepo.ed_media, ed, id);
			}else{
				st = 0;
				ed = ci.duration;
			}
			cvdur = ed - st;
			var bodyst, bdur, rate;
			if(layer_obj.body_t){
				bodyst = layer_obj.body_t[0];
				bdur = layer_obj.body_t[1] - layer_obj.body_t[0];
				if(bdur !== cvdur) rate = time_mode(id, layer_obj, st, bdur, cvdur, bodyst, urepo);
			}else{
				bodyst = 0;
			}
			var stobj = {"id": id, "end": ed, "bodyst": bodyst};
			if(rate) stobj.rate = rate;
			Mut.arr.add(urepo.st_media, st, stobj);
			add_durs(urepo.durs, st, ed, id, layer_obj.type, bodyst);
			that.all_medias[id] = {"type": layer_obj.type, "canvas": url, "parent": ci.parent_cv, "self": murl, "orgp": layer_obj.orgp};
			if(layer_obj.type === "Canvas") that.all_medias[id].cvinst = new Subcanvas(murl, id, ci, Mia.osdv);
			layer_obj.done = true;
		}
		function add_durs(durs, st, ed, id, type, bodyst){
			if(!durs[st]) durs[st] = {};
			Mut.arr.add(durs[st], ed, {"id": id, "label": Mut.uri.filename(id), "type": type, "bodyst": bodyst});;
		}
		function time_mode(id, layer_obj, st, bdur, cvdur, bodyst, urepo){
			switch(layer_obj.timeMode){
			case "scale":
				return bdur / cvdur;
			case "loop":
				Mut.obj.prepare(urepo, "trim");
				if(bdur > cvdur) break;
				for(var t=st+bdur,max=st+cvdur; t<max; t+=bdur){
					Mut.arr.add(urepo.trim, t, {"id": id, "bodyst": bodyst});
				}
				break;
			case "trim":
			default:
				Mut.obj.prepare(urepo, "trim");
				if(bdur > cvdur) break;
				Mut.arr.add(urepo.trim, st + bdur, {"id": id, "trim": true});
			}
			return null;
		}
	},
	gen_id: function(base, obj){
		return base + (obj.type === "Audio" ? "" : 
			(obj.loc ? obj.loc.replace(/^#/, "@") : "") +
			((obj.type === "Text" && obj.class === "paint") ? "_" + Mut.str.easy_fingerprint(obj.val) : "")
			
		);
	},
	register: function(keyuri, keys, is_subcanvas){
		if(!keys) keys = this.repokeys;
		var count = 0;
		var puri =  is_subcanvas ? Mia.cinfo[keyuri].parent_cv : null;
		
		if(this.repo[keyuri]) keys.forEach(function(key){
			if(is_subcanvas){
				this[key] = merge(this[key] || {}, this.repo[keyuri][key] || {});
				if(!this.repo[puri][key]) this.repo[puri][key] = this[key];
			}
			else this[key] = this.repo[keyuri][key] || {};
			if(key.match(/^st/)) count += Object.keys(this[key]).length;
		}, this);
		Mav.clock.current_items = count;
		
		function merge(base, delta){
			var keys = Mut.arr.uniq_merge(Object.keys(base), Object.keys(delta));
			keys.forEach(function(k){
				if(base[k]){
					if(delta[k]) base[k] = (base[k] instanceof Array) ? base[k].concat(delta[k]) :
					merge(base[k], delta[k]);
				}else base[k] = delta[k];
			});
			return base;
		}
	},
	update_page_anno: function(newuri, prevuri, is_subcanvas, skip_setupmedia){
		if(prevuri){
			this.clear_current(prevuri);
		}else if(!skip_setupmedia){
			this.setup_media(is_subcanvas);
		}
		if(!Mav.type) return;
		this.register(newuri, null, is_subcanvas);
	},
	get_tileid: function(obj, cinfo){
		return obj.tile ? obj.tid : cinfo.imgurl || cinfo.mediaurl;
	},
	prepare_popup: function(){
		var pos = this.noreg.pos;
		this.noreg.pixpos = Mwa.pct2px(pos, Mav.vinfo.dim);
		this.ann_popup = Mut.dom.get(".annotorious-popup")[0];
		Mia.elt.jldarea.style.zIndex = 3;
		
		if(! Mia.elt.popbox) Mia.elt.popbox = Mut.dom.get(".annotorious-popup-text")[0];

	},
	set_new: function(an){
		var keyuri = Mav.key_uri();
		if(!(an.has_region =
			(Mav.cinfo.dim && Mav.cinfo.dim.x) || (Mav.type !== "audio"))){
			Mwa.setup_geometry(an, Mau.annogeom);
		}

		var selend = Mav.state.selstart === Mav.state.selend ? Mav.state.selend + 1 : Mav.state.selend;
		Manno.set_anno_meta(
			an,
			keyuri,
			Mav.cinfo.dim || Mav.vinfo.dim,
			true,
			((an.has_region ? "&" : "") + "t=" + Mav.state.selstart + "," 
			+ (Mav.state.selstart === Mav.state.selend ?
				Mav.state.selend + 1 : Mav.state.selend)
			)
		);
		this.add(an, Mav.state.selstart, Mav.state.selend, an.has_region, keyuri);
		this.register(keyuri, ["start", "end", "durs"]);
		Mav.clock.add_timeline();
		this.clear(an);
		if(Mav.is_paused()) Mav.resume();
		Muib.anno.jldpanel.showbtn();
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
	add: function(annobj, st, ed, has_region, keyuri, subc_parent, cinfo){
		var t_offset = subc_parent ? cinfo.trange[0] : 0;
		if(typeof(has_region) !== "undefined") annobj.has_region = has_region;
		st = Math.floor(st) + t_offset;
		ed = Math.floor(ed) + t_offset;
		if(st === ed) ed++;
		annobj.sted = [st, ed];
		if(subc_parent){
			annobj.subcinfo = Mia.cinfo[keyuri];
		}
		Mut.obj.prepare(this.repo, keyuri);
		Mut.obj.prepare(this.repo[keyuri], "start");
		Mut.obj.prepare(this.repo[keyuri], "end");
		Mut.obj.prepare(this.repo[keyuri], "durs");
		if(this.repo[keyuri].start[st]){
			if(Mav.vinfo.bgtile){
				Mut.obj.prepare(this.repo[keyuri], "auftakt");
				this.repo[keyuri].auftakt[annobj.id] = {map: this.repo[keyuri].start[st][0]};
			}
		}else this.repo[keyuri].start[st] = [];
		this.repo[keyuri].start[st].push(annobj);
		Mut.arr.add(this.repo[keyuri].end, ed, annobj);
		this.idx[annobj.id] = annobj;
		Mut.obj.prepare(this.repo[keyuri].durs, st);
		Mut.arr.add(this.repo[keyuri].durs[st], ed, {"id": annobj.id, "label":"text annotation", "type":"annot", "anno": annobj});
		
		Mut.arr.add(Manno.page, keyuri, annobj);
		if(!this.pre_expose){
			Manno.current.push(annobj);
			if(annobj.has_region && annobj.text) this.clone_popup(annobj);
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
		for(var j=0, n=tanno.length; j<n; j++){
			if(tanno[j].id === an.id){
				delete tanno[j];
				break;
			}
		}
		this.register_showing(an, false);
		this.register(an.imgurl, ["start", "end", "durs"]);
		Mav.clock.add_timeline();
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
		return Mwa.ratio2px(an, Mia.osdv.viewer.source.dimensions).slice(0,4).join(",");
	},
	set_popup_pos: function(popup, pixpos){
		popup.style.left = pixpos[0] + "px";
		popup.style.top = (pixpos[1] + pixpos[3] + 13) + "px";
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
	},
	

	
	
	
	check: function(thistime, lasttime){
		for(var now = lasttime + 1; now <= thistime; now++){
			this.check_now(now);
			if(Mav.cinfo.duration && now > Mav.cinfo.duration){
				this.mute.current(false);
				Mav.check_autoturn();
			}
		}
		if(this.test_showing() === 0){
		}
	},
	check_now: function(now){
		var hidetime = now,//now - 1ではない（初期now-1→改訂now→再訂正2018-02-14→再々改訂2018-02-18）;
		turned = false;
		if(this.end[hidetime] || this.ed_media[hidetime]){
			Mia.env.tpos = this.set_tpos(hidetime);
			if(this.end[hidetime]) this.end[hidetime].forEach(function(an){
				this.clear(an);
				if(an.has_region) this.check_multi();
				else this.test_noreg_overlap(now, 1, an);
			}, this);
			if(this.ed_media[hidetime]) this.ed_media[hidetime].forEach(function(id){
				this.showhide_item({"id": id}, 0, hidetime);
			}, this);
		}
		if(this.start[now] || this.st_media[now]){
			Mia.env.tpos = this.set_tpos(now);
			var noreg_ans = [];
			if(this.start[now]){
				this.start[now].forEach(function(an, i){
					noreg_ans = this.expose(an, now);
				}, this);
				this.check_multi();
			}
			if(this.st_media[now]) this.st_media[now].forEach(function(o){
				this.showhide_item(o, 1, now);
			}, this);
			if(noreg_ans.length === 1) this.show_noreg_popup(this.idx[noreg_ans[0]]);
		}
		if(this.trim && this.trim[now]) this.trim[now].forEach(function(o){
			this.showhide_item(o, 0.5, now);
		}, this);
	},
	set_rewind: function(t, ready_evt){
		if(!this.state.rewinded){
			if(Miiif.use && Mav.state.initpos){
				Mav.avelt.currentTime = Mav.state.initpos;
			}
			this.state.rewinded = true;
			return;
		}
		if(t===0 && !ready_evt) Mwa.antrs.removeAll();
		Object.keys(this.showing).forEach(function(anid){
			var an = this.idx[anid];
			if(an.sted[0] > t) this.clear(an);
			else if(an.sted[1] < t) this.clear(an);
		}, this);
		if(!ready_evt){
			this.check_now(t);
			Mav.state.lastsec = t;
		}else
			this.check_multi();
	},

	showhide_item: function(m, op, now){
		var minfo = Mav.annot.all_medias[m.id];
		if(minfo.type === "Image"){
			if(op) this.show.img(m, now, minfo);
			else this.mute.img(m.id, minfo, check_hide(now));
		}else{
			if(op === 1) this.show.avc(m, now, minfo);
			else if(op === 0.5){
				if(m.trim){
					Mav.melts[m.id].pause();
				}else{
					Mav.melts[m.id].currentTime = m.bodyst;
				}
			}else this.mute.avc(m.id, check_hide(now));
		}
		
		function check_hide(now){
			if(now === Mav.cinfo.duration) return false;
			else return true;
		}
	},
	
	show: {
		avc: function (m, now, minfo){
			var elt = Mav.melts[m.id];
			if(elt === true){
				return;
			}
			if(!elt){
				return;
			}
			if(minfo.type === "Canvas"){
				Mia.cinfo[minfo.self].cvinst.reset_zoom(true);
			}
			if(elt.tagName.toLowerCase() === "div"){
				if(now === 0 && !Mav.clock.playing && elt.className === "texthighlight") return;
				elt.style.display = "block";
				Mav.annot.up_media[m.id] = [now, m.end, m.bodyst];
				return;
			}else elt.style.display = "block";
			if(! Mav.clock.seeked){
				if(now !== m.bodyst){
					try{
						elt.currentTime = m.bodyst;
					}catch(e){
						console.error(e.message, "when seeking from", elt.currentTime, "to", m.bodyst);
					}
				}else if(now === 0){
					elt.currentTime = 0;
				}else if(now !== elt.currentTime){
					elt.currentTime = now;
				}
			}
			if(m.rate){
				elt.playbackRate = m.rate;
			}else if(elt.playbackRate !== 1){
				elt.playbackRate = 1;
			}
			if(Mav.clock.playing){
				elt.play();
				Mut.arr.uniq_push(Mav.annot.playing, m.id);
			}
			Mav.annot.up_media[m.id] = [now, m.end, m.bodyst];
		},
		
		img: function(m, now, minfo){
			var itemidx = Mav.annot.img_layer.check(m.id, minfo);
			if(itemidx === -1) return;
			Mav.annot.up_media[m.id] = [now, m.end, null];
			if(Mav.annot.img_layer.viewer.world.getItemCount()===0){
				var c=0, sid = setInterval(function(){
					if(Mav.annot.img_layer.viewer.world.getItemCount() || c++ > 10){
						Mav.annot.img_layer.setopacity(1, itemidx);
						clearInterval(sid);
					}else if(c++ > 10) clearInterval(sid);
				}, 200);
			}else Mav.annot.img_layer.setopacity(1, itemidx);
		}
	},
	
	mute: {
		current: function(to_hide){
			Object.keys(Mav.annot.up_media).forEach(function(id){
				var itemidx = Mav.annot.img_layer.check(id);
				if(itemidx === -1) {
					if(Mav.melts[id]) this.avc(id, to_hide);
					else delete Mav.annot.up_media[id];
				}else this.img(id, null, to_hide);
			}, this);
		},
		
		avc: function(id, to_hide){
			if(to_hide){
				Mav.melts[id].style.display = "none";
				delete Mav.annot.up_media[id];
			}
			if(Mav.clock.playing && Mav.melts[id].tagName.toLowerCase() !== "div"){
				Mav.melts[id].pause();
				Mut.arr.remove(Mav.annot.playing, id);
			}
		},
		img: function(id, minfo, to_hide){
			var itemidx = Mav.annot.img_layer.check(id, minfo);
			if(itemidx === -1) return;
			if(to_hide) delete Mav.annot.up_media[id];
			Mav.annot.img_layer.setopacity(0, itemidx);
		}
	},
	img_layer: {
		items: null,
		viewer: null,
		check: function(id, minfo){
			this.get_layer(id, minfo);
			return this.items ? this.items.indexOf(id) : -1;//0;
		},
		get_layer: function(id, mi){
			if(!mi) mi = Mav.annot.all_medias[id];
			var pcvid = mi.parent, mycvid = mi.canvas,
			subcv =Mia.cinfo[mycvid].cvinst;
			this.items = subcv ? (subcv.layers ? subcv.layers.items : null) : Mia.layers.items;
			this.viewer = subcv ? subcv.viewer : Mia.osdv.viewer;
			this.myci = Mia.cinfo[mi.canvas];
		},
		setopacity: function(op, i){
			try{
				this.viewer.world.getItemAt(i).setOpacity(op);
			}catch(e){
				console.error(e.message, "for image", i, "in", this.viewer, this.viewer.world._items);
			}
		},
		force_hide: function(id){
			var done = false;
			this.myci.layer.forEach(function(l, i){
				if(l.tid === id){
					var item = this.viewer.world.getItemAt(i);
					if(!item){
						console.log("seems already cleared", id, "at", i);
					}else if(item.source.uri === id){
						item.setOpacity(0);
						console.log("cleared", id, "at", i, "item", item);
					}else{
						console.log("already assigned another image, instead of", id);
					}
					done = true;
					return;
				}
			}, this);
			if(!done) console.log("could not clear", id);
			delete Mav.annot.up_media[id];
		},
		is_image: function(id){
			return Mav.annot.all_medias[id].type === "Image";
		}
	},
	
	clear: function(an){
		if(this.showing[an.id] === undefined){
			return;
		}
		if(!this.pre_expose){
			var annotorious = an.subcinfo ? an.subcinfo.antrs : Mwa.antrs;
			Mwa.antrs.removeAnnotation(an);
			if(this.showing[an.id] ==="clone") this.clone[an.id].style.opacity = 0;
		}
		this.register_showing(an, false);
	},
	
	clear_current: function(prevuri){
		this.remove_current(prevuri);
		if(Miiif.max_cvmedia > 1) this.mute.current(true);
	},
	remove_current: function(prevuri){
		Mwa.antrs.removeAll();
		var ci = typeof(prevuri) === "string" ? Mia.cinfo[prevuri] : Mav.cinfo;
		if(ci.subcanvases) ci.subcanvases.forEach(
			function(subc){Mia.cinfo[subc].antrs.removeAll(); }
		);
	},
	expose: function(an, now){
		if(this.showing[an.id] !== undefined){
			return [];
		}
		var noreg_ans = [],
		annotorious = an.subcinfo ? an.subcinfo.antrs : Mwa.antrs;;
		this.register_showing(an, true);
		if(this.pre_expose){
			if(an.has_region) annotorious.highlightAnnotation(an);
		}else if(an.has_region){
			annotorious.addAnnotation(an);
			if(Miiif.tfmedia) annotorious.highlightAnnotation(an);
			else this.show_clone(an.id);
		}else{
			noreg_ans = this.test_noreg_overlap(now, 0, an);
		}
		return noreg_ans;
	},
	
	register_showing: function(an, check_in){
		if(check_in){
			this.showing[an.id] = an.has_region;
			if(an.has_region) Mut.arr.add(this.showing_region, an.has_region, an);
		}else{
			delete this.showing[an.id];
			if(an.has_region){
				var idx = this.showing_region[an.has_region].indexOf(an);
				if(idx !== -1) this.showing_region[an.has_region].splice(idx, 1);
			}
		}
	},
	check_multi: function(){
		for(var region in this.showing_region){
			var anarr = this.showing_region[region];
			if(anarr.length > 1){
				Mwa.antrs.highlightAnnotation(anarr[0]);
				for(var i=1; i<anarr.length; i++) Muib.anno.popup.add_more(anarr[i].text, null, i);
			}
		}
		if(this.test_showing() === 0 && Mia.elt.popbox){
			Mia.elt.popbox.parentNode.style.opacity = 0;
			return;
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
		Mwa.antrs.highlightAnnotation(an);
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
	test_noreg_overlap: function(now, deleted, an){
		if(!Manno.frags[Mia.env.tpos]){
			Manno.frags[Mia.env.tpos] = this.get_noregion_annot();
		}
		if(an.has_region) return [];
		
		if(Manno.frags[Mia.env.tpos].length){
			var topanno = this.idx[Manno.frags[Mia.env.tpos][0]];
			if(this.showing[topanno.id] !== undefined) Mwa.antrs.removeAnnotation(topanno);
			Mwa.antrs.addAnnotation(topanno);
			Mwa.antrs.highlightAnnotation(topanno);
			Manno.multi_annot(topanno, Manno.frags[Mia.env.tpos]);
			return Manno.frags[Mia.env.tpos];
		}else if(deleted && Mia.elt.popbox){
			Mia.elt.popbox.parentNode.style.opacity = 0;
			return [];
		}
		return [an.id];
	},
	test_showing: function(){
		return Object.keys(this.showing).length;
	},
	show_clone: function(anid){
		if(!this.clone[anid]) return;
		this.clone[anid].style.opacity = 1;
		this.showing[anid] = "clone";
	}
};


Mav.clock = {
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
	tcelt: null,
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
		this.btn.onclick = this.btn_action;
		this.btn.style.width = "80px";
		this.btn.style.marginRight = "5px";
		this.disp = Mut.dom.elt("span", "0:00 / "+this.end_tf, [["class", "disp"]]);
		this.disp.style.width = "90px";
		this.disp.style.marginRight = "3px";
		this.bar = Mut.dom.elt("input","",[["type", "range"], ["min", 0], ["max", dur], ["step", 0.1], ["value", 0]]);
		this.bar.addEventListener("change", function(ev) {
			Mav.clock.update(Math.floor(ev.target.value));
		});
		var timeline = this.tcelt = Mut.dom.elt("div", "", [["id", "timeline"]]);
		timeline.style.width = (Mia.elt.osdv.clientWidth - (80 + 90 + 15)) + "px";
		this.tl = Mut.dom.elt("div", "", [["id", "tlcontainer"]]);
		Mut.dom.append(timeline, [this.bar, this.tl]);
		Mut.dom.append(this.container, [this.btn, this.disp, timeline]);
		Mia.elt.maindiv.insertBefore(this.container, Mia.elt.imgdsc);
		Muib.appb.set_msg("done clock setup");
		
	},
	add_timeline: function(Dur){
		if(!this.tl) return false;
		if(!Dur) Dur = Mav.cinfo.duration;
		if(this.tl.firstChild) this.tl.innerHTML = "";
		var count = 0, cvdheight;
		Object.keys(Mav.annot.durs).sort(Mut.num.nasc).forEach(function(st){
			Object.keys(Mav.annot.durs[st]).sort(Mut.num.nasc).forEach(function(ed){
				Mav.annot.durs[st][ed].forEach(function(obj){
					var div = Mut.dom.elt("div"), 
					sp = Mut.dom.elt("span", "", [["title", st + "-" + ed + " (" + obj.label + ")"], ["class", obj.type]]);
					sp.style.width = ((ed - st)*100 / Dur) + "%";
					sp.style.marginLeft = (st*100 / Dur) + "%";
					sp.onclick = function(ev){Mav.clock.jump(ev, Number(st), Number(ed));};
					sp.style.cursor = "pointer";
					div.appendChild(sp);
					Mav.clock.tl.appendChild(div);
					count++;
				});
			});
		});
		if(count > 15){
			this.tl.style.overflowY = "scroll";
			this.tl.style.width = (this.tcelt.clientWidth + 16) + "px";
		}else{
			this.tl.style.overflowY = "visible";
			this.tl.style.width = "100%";
		}
	},
	jump: function(ev, st, ed){
		this.update(st + (ed - st) * ev.offsetX / ev.target.clientWidth);
	},
	start: function(){
		var now = 0;
		if(this.seeked){
			now = Mav.state.lastsec;
		}
		this.playing = true;
		this.set_disp(now);
		this.timer = window.setInterval(this.update, this.delay);
		Mav.annot.check(now, -1);
		this.seeked = false;
		this.btn.innerText = "pause";
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
			if(Miiif.hint.auto_advance){
				Mav.turn_page(Mav.key_uri(), 1);
			}else{
				Mav.clock.btn.innerText = "replay";
			}
			if(!Mav.check_autoturn()) Mav.clock.btn.innerText = "replay";
		}else{
			Mav.clock.bar.value = bartime;
			if(now !== Mav.state.lastsec){
				var lastsec = Mav.state.lastsec;
				Mav.annot.check(now, Mav.state.lastsec);
				Mav.clock.set_disp(now);
				if(now < lastsec) Mav.clock.test_seek(now, 0, lastsec);
				else if(now - lastsec > 1) Mav.clock.test_seek(now, Mav.clock.last_st - 1, now);
			}
			Mav.state.lastsec = now;
		}
		
	},
	pause: function(){
		this.playing = false;
		window.clearInterval(this.timer);
		for(var id in Mav.annot.up_media){
			var elt = Mav.melts[id];
			if(Mav.annot.img_layer.check(id) === -1 && elt.pause) elt.pause();
		}
		this.btn.innerText = "resume";
	},
	resume: function(){
		this.playing = true;
		this.timer = window.setInterval(this.update, this.delay);
		this.seeked = false;
		for(var id in Mav.annot.up_media){
			var elt = Mav.melts[id];
			if(Mav.annot.img_layer.check(id) === -1 && elt.play) elt.play();
		}
		this.btn.innerText = "pause";
	},
	btn_action: function(e){
		var label = e.target.firstChild;
		switch(label.data){
		case "replay":
			Mav.state.lastsec = this.current = 0;
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
							if(!m.anno.has_region) Mav.annot.test_noreg_overlap(now, 1, m.anno);
						}else if(Mav.annot.up_media[m.id]){
							Mav.annot.showhide_item(m, 0);
							if(now < st) this.seek_media(m.id, now, st, m.bodyst);
						}
					}else if(!hide){
						if(m.type === "annot"){
							Mav.annot.expose(m.anno, now);
						}else{
							this.seek_media(m.id, now, st, m.bodyst);
							if(! Mav.annot.up_media[m.id]) Mav.annot.showhide_item(m, 1, now);
						}
						dont_hide.push(m.id);
					}
				}, this);
			}
		}
		Mav.annot.check_multi();
	},
	
	seek_media: function(id, now, st, bodyst){
		var is_image;
		if((is_image = Mav.annot.img_layer.is_image(id))) return;
		if(!st) st = Mav.annot.up_media[id][0];
		if(!is_image) Mav.melts[id].currentTime = now - st + (bodyst || 0);
		this.seeked = true;//再生ではなく命令でシーク
	},
	set_disp: function(now){
		this.disp.innerText = this.t_format(now) + " / " + this.end_tf;
	},
	t_format: function(t){
		var m = Math.floor(t / 60), s = t % 60;
		return m + ":" + (s < 10 ? "0": "") + Math.floor(s);
	}

};

var Subcanvas = function(uri, meltsid, pci, posdv){
	this.cinfo = Mia.cinfo[uri];
	this.cinfo.cvinst = this;
	this.uri = uri;
	this.meltsid = meltsid;
	this.pci = pci;
	this.posdv = posdv;
};
Subcanvas.cid = 1;
Subcanvas.prototype = {

	osd_setup: function(mfobj){
		var ci = this.cinfo,
		eltid = Mia.eltmap.osdv + "-sub" + (Subcanvas.cid++),	//eltmap.osdv="openseadragon"で始めないとAnnotoriousで使えない
		osdv = new OSDV(null, eltid);
		if(!mfobj.pos){
			console.warn("no dimensions specified. assumes half of parent canvas");
			mfobj.pos = [0, 0, this.posdv.elt.clientWidth / 2, this.posdv.elt.clientHeight / 2];
			osdv.elt.style.background = "rgba(238, 215, 130, 0.6)";
		}
		Mav.melts[this.meltsid] = osdv.elt;
		Mav.append_and_set(this.meltsid, mfobj, this.pci, this.posdv, false);
		osdv.elt.classList.add("subcanvas");
		osdv.init_viewer({
			"id" : eltid,
			"prefixUrl" : Mia.const.osd_imgpath,
			"showHomeControl" : false,
			"showRotationControl" : false,
			"showFullPageControl": false,
			"showZoomControl": false,
			"panHorizontal": 	false,
			"panVertical": 	false,
			"gestureSettingsMouse": {scrollToZoom: false, clickToZoom: false},
			"visibilityRatio": 	1,
			"showNavigator" : false,
			"tileSources": ci.subctile
		});
		var viewport = osdv.viewer.viewport,
		dim = new OpenSeadragon.Point(mfobj.pos[2], mfobj.pos[3]);
		viewport.containerSize = viewport._containerInnerSize = dim;
		this.original_pos = mfobj.pos;
		this.current_pos = Mut.obj.copy(mfobj.pos);
		this.original_zoom = viewport.getZoom();
		this.osdv = osdv;
		this.viewer = osdv.viewer;
		if(ci.layer){
			this.layers = new Layers({"env":{"keyuri": this.uri}});
			this.layers.viewer = osdv.viewer;
			this.layers.add_layer(ci);
		}
		if(this.cinfo.has_3d){
			osdv.elt.classList.add("threed");
			var osdcs = osdv.elt.getElementsByClassName("openseadragon-container")[0].style;
			osdcs.position = "absolute";
			Muib.threed.setup_osd_zoom(osdv.elt, Mia.osdv.viewer);
		}else{
			this.wa = new WebAnnotorious(osdv, {"nobutton": true});
			this.cinfo.antrs = this.wa.antrs;
		}
			this.resizable();
		this.movable();
		return osdv.elt;
	},
	div_setup: function(mfobj){
		var ci = this.cinfo,
		eltid = "threed-sub" + (Subcanvas.cid++),	//eltmap.osdv="openseadragon"で始めないとAnnotoriousで使えない
		osdv = new OSDV(null, eltid);
		if(!mfobj.pos){
			console.warn("no dimensions specified. assumes half of parent canvas");
			mfobj.pos = [0, 0, this.posdv.elt.clientWidth / 2, this.posdv.elt.clientHeight / 2];
			osdv.elt.style.background = "rgba(238, 215, 130, 0.6)";
		}
		Mav.melts[this.meltsid] = osdv.elt;
		Mav.append_and_set(this.meltsid, o, this.pci, this.posdv, false);
		this.osdv = osdv;
		Muib.threed.setup_osd_zoom(Mia.osdv.viewer, osdv.elt);
		
		return osdv.elt;
	},
	
	movable: function(){
		var that = this, ov = this.osdv.viewer;
		this.movecount = null;
		this.osdv.elt.style.cursor = "move";
		this.posdv.elt.style.overflow = "hidden";
		
		ov.addHandler("canvas-press", function(e){that.move_start(e);});
		ov.addHandler("canvas-drag", function(e){that.move_elt(e);});
		ov.addHandler("canvas-release", function(e){that.move_end(e);});
		ov.addHandler("canvas-double-click", function(e){that.reset_pos(e);});
	},
	move_start: function(e){
		this.movecount = 1;
		if(this.osdv.elt.style.cursor !== "pointer") this.osdv.elt.classList.add("moving");
		this.startpos = {x: e.position.x, y: e.position.y};
		this.start_pagepos = {x: this.osdv.elt.offsetLeft, y: this.osdv.elt.offsetTop};
	},
	move_elt: function(e){
		if(this.osdv.elt.style.cursor==="pointer"){
			document.dispatchEvent(new MouseEvent("mousemove", e.originalEvent));
		}else if(this.movecount){
			var delta = {x: e.position.x - this.startpos.x, y: e.position.y - this.startpos.y};
			if(delta.x !== 0 && delta.y !== 0){
				this.osdv.elt.style.left = (this.osdv.elt.offsetLeft + delta.x) + "px";
				this.osdv.elt.style.top = (this.osdv.elt.offsetTop + delta.y) + "px";
				if(Math.abs(delta.x) > 1 || Math.abs(delta.y) > 1) this.movecount++;
			}
		}
	},
	move_end: function(e){
		e.cancelBubble = true;
		if(this.movecount > 1){
			var basepos = this.current_pos,
			elt = this.osdv.elt,
			delta = {x: elt.offsetLeft - this.start_pagepos.x, y: elt.offsetTop - this.start_pagepos.y},
			newpos = [basepos[0] + delta.x, basepos[1] + delta.y, basepos[2], basepos[3]];
			this.refresh_posinfo(newpos);
		}else{
			if(this.osdv.elt.three) this.osdv.elt.dispatchEvent(new MouseEvent("canvas-mousedown", e.originalEvent));
		}
		this.movecount = 0;
		this.osdv.elt.classList.remove("moving");
	},
	refresh_posinfo: function(newpos, back_to_original){
		this.current_pos = newpos;
		if(this.cinfo.is_overlay){
			var rect = Muib.tool.arr2viewportRect(newpos, this.pci.dim.x),
			myviewer = Mia.osdv.viewer,
			myov = myviewer.getOverlayById(this.osdv.elt);
			myov.update(rect);
			if(back_to_original){
				myov.drawHTML( myviewer.overlaysContainer, myviewer.viewport );
			}
		}
		this.reset_zoom(false);
	},
	reset_pos: function(e){
		e.cancelBubble = true;
		var elt = this.osdv.elt;
		if(this.cinfo.is_overlay){
		}else{
			elt.style.left = this.original_pos[0] + "px";
			elt.style.top = this.original_pos[1] + "px";
		}
		if(!this.movecount) this.refresh_posinfo(this.original_pos, true);
		if(this.resized){
			elt.style.width = this.original_pos[2] + "px";
			elt.style.height = this.original_pos[3] + "px";
			this.refresh_size(this.original_adjust, false);
		}
	},
	reset_zoom: function(reset_vp){
		var vp = this.viewer.viewport;
		if(vp.getZoom() === this.original_zoom) return;
		if(reset_vp){
			vp.containerSize = vp._containerInnerSize = new OpenSeadragon.Point(this.original_pos[2], this.original_pos[3]);
		}
		vp.zoomTo(this.original_zoom, null, true);
	},
	
	resizable: function(){
		var that = this,
		osdv = this.osdv,
		ov = this.viewer,
		posdv = this.posdv,
		ci = this.cinfo;
		this.rframe = Mut.dom.elt("div", "", [["class", "rframe"]]),
		this.rhandle = Mut.dom.elt("div", "", [["class", "rhandle"]]),
		this.guide = Mut.dom.elt("div", "", [["class", "guide"]]),
		this.catcher = Mut.dom.elt("div", "", [["class", "catcher"]]),
		this.handlechar = Mut.dom.elt("span","⇔");
		this.rhandle.appendChild(this.handlechar);
		this.rframe.appendChild(this.rhandle);
		this.ratio = this.original_pos[3] / this.original_pos[2];
		this.original_adjust = ci.adjust;
		this.resized = false;
		this.maxpos = {
			top: posdv.elt.offsetTop + 100,
			left: posdv.elt.offsetLeft + 100, 
			bottom: posdv.elt.clientHeight,
			right: posdv.elt.clientWidth
		};

		osdv.container.insertBefore(this.rframe, osdv.container.firstChild);
		osdv.container.appendChild(this.guide);
		osdv.container.appendChild(this.catcher);
		osdv.container.style.overflow = "visible";
		this.rhandle.addEventListener("mousedown", function(e){that.resize_start(e);}, false);
		this.rhandle.addEventListener("mousemove", function(e){that.resize_elt(e);}, false);
		this.rhandle.addEventListener("mouseup", function(e){that.resize_end(e);}, true);
		this.catcher.addEventListener("mousemove", function(e){that.resize_elt(e);}, false);
		this.catcher.addEventListener("mouseup", function(e){that.resize_end(e);}, true);
		this.rframe.addEventListener("mousemove", function(e){that.resize_elt(e);}, false);
		this.rframe.addEventListener("mouseup", function(e){that.resize_end(e);}, true);
	},
	resize_start: function(e){
		var elt = this.osdv.elt;
		this.is_resizing = true;
		this.rhandle.classList.add("resizing");
		this.rframe.classList.add("resizing");
		this.guide.style.display = "block";
		elt.classList.add("moving");
		this.start_pagepos = {x: e.pageX, y: e.pageY};
		this.rdelta = {x:0, y: 0};
		this.startosdv = {
			bottom: elt.offsetTop + elt.clientHeight,
			right: elt.offsetLeft + elt.clientWidth
		}
		this.catcher.style.display = "block";
		this.catcher.style.width = (this.posdv.elt.clientWidth - elt.offsetLeft) + "px";
		this.catcher.style.height = (this.posdv.elt.clientHeight - elt.offsetTop) + "px";
		
		e.stopPropagation();
	},
	resize_elt: function(e){
		if(!this.is_resizing) return;
		if(e.pageX < this.maxpos.left || e.pageY < this.maxpos.top){
			return;
		}
		var x = e.pageX - this.start_pagepos.x,
		y = x * this.ratio;
		if((y + this.startosdv.bottom) > this.maxpos.bottom
			|| (x + this.startosdv.right) > this.maxpos.right){
			return;
		}
		this.rframe.style.right = -x + "px";
		this.rframe.style.bottom = -y + "px";
		this.rdelta.x = x;
		this.rdelta.y = y;
	},
	resize_end: function(e){
		if(!this.is_resizing) return;
		var elt = this.osdv.elt;
		this.guide.style.display = "none";
		this.catcher.style.display = "none";
		elt.classList.remove("moving");
		this.rhandle.classList.remove("resizing");
		this.rframe.classList.remove("resizing");
		if(this.rdelta.x !==0 || this.rdelta.y !==0){
			elt.style.width = this.rframe.offsetWidth + "px";
			elt.style.height = this.rframe.offsetHeight + "px";
			this.refresh_size(elt.clientWidth / this.current_pos[2] , true);
		}
		this.rframe.style.right = 0;
		this.rframe.style.bottom = 0;
		this.is_resizing = false;
	},
	refresh_size: function(adjust, resized){
		var reladjust = adjust / this.pci.adjust;
		this.cinfo.adjust =  adjust;
		this.resized = resized;
		var basepos = this.current_pos,
		newpos = [basepos[0], basepos[1], basepos[2] * reladjust, basepos[3] * reladjust];
		this.refresh_posinfo(newpos);
		if(this.cinfo.has_3d) this.osdv.elt.dispatchEvent(new Event("resize"));
	},

};

var Mvd = {
	init: function(vurl){
		Mav.start_pos(vurl);
		if(Mav.state.tfrag) vurl += "#t=" + Mav.state.tfrag;
		var info = Mav.cvurl ? Mia.cinfo[Mav.cvurl].mf[Mav.vinfo.url][0] : {"type": "Video"};
		Mav.gen_elt(Mav.vinfo.url, Mav.vinfo.url, info, true);
		Muib.appb.set_msg("loading video..." + Mut.uri.filename(vurl));
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
	need_resize: false,
	init: function(aurl){
		Mav.start_pos(aurl);
		if(Mav.state.tfrag) aurl += "#t=" + Mav.state.tfrag;
		var info = {"type": "Audio"};
		if(Mav.cvurl){
			var ci = Mia.cinfo[Mav.cvurl];
			if(ci && ci.mf[Mav.vinfo.url]) info = ci.mf[Mav.vinfo.url][0];
		}
		Mav.gen_elt(Mav.vinfo.url, Mav.vinfo.url, info, true);
		if(!Mav.vinfo.bgtile /*|| Mia.env.numTiles - Miiif.canvas.num_filler === 0*/) this.need_resize = true;
		this.set_osdv_conf(this.need_resize);
		this.set_height(Mav.avelt);
		Mav.annot.noreg.pos = this.annopos;
		Muib.appb.set_msg("loading audio...");
		Mav.setup_elt();
		Mav.map_handlers("Audio");
		Mav.set_media_handlers();
		Mav.set_annotroious_handlers();
		if(this.need_resize) this.set_more();
	},
	set_osdv_conf: function(resize){
		if(Mia.tindex.state.use) this.opts.dim.y = 400;
		if(resize) Mav.opts.minw = this.opts.dim.x + "px";
	},
	set_more: function(){
		Mia.elt.osd_cntner.addEventListener("mouseover", function(){
			if(Mau.msg_state){
				Muib.tool.fadeio(Mia.elt.msg, 2000, 1, 1, 0.5);
				Mau.msg_state = false;
			}
		});
	},
	set_height: function(elt){
		if(this.need_resize) elt.style.height = this.opts.dim.y + "px";
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
		Muib.appb.set_msg(Mia.env.lang === "ja" ?
			"左上□をクリックし、ドラッグ開始～終了期間を対象に注釈できます。<br/>（選択範囲の座標は関係しません）":
			"Click upper-left □. Drag start-end duration will be annot range.<br/>(coord of selected region is irrelevant)", false);
		Muib.appb.set_status("auto");
	}
};

var YT;
var Mytb = {
	player: null,
	vid: null,
	dim: {x: 800, y: 450},
	c: {NO_KEEP: 0, KEEP: 1, SEEK_WAIT: 2},
	init: function(vurl){
		Mav.start_pos(vurl);
		var uparam = vurl.match(/(\?v=|youtu.be\/)(.*)$/);
		this.vid = uparam[2];
		Mia.elt.media = Mav.avelt = Mut.dom.elt("div", "", [["id", "player"]]);
		Mav.setup_elt(); 
		Mut.dom.append(Mut.dom.get("head")[0], Mut.dom.elt("script", "", [["src", "https://www.youtube.com/iframe_api"]]));
		Mav.map_handlers("Video");
		Mav.resume = Mytb.resume;
		this.set_annotroious_handlers();
	},
	onPlayerReady: function(ev) {
		Mia.elt.media = Mav.avelt = Mut.dom.get(Mav.avelt.id, "id");
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
		var sid = setInterval(function(){
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
		Mwa.antrs.addHandler("onSelectionStarted", function(ev){
			Mav.state.selstart = Mytb.sec_now();
		});
		Mwa.antrs.addHandler("onSelectionCompleted", function(ev){
			Mav.state.selend = Mytb.sec_now();
			Mytb.pause();
		});
		Mwa.antrs.addHandler("onSelectionCanceled", function(e){
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
