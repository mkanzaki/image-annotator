# Image Annotator

[Image annotator](http://www.kanzaki.com/works/2016/pub/image-annotator) displays image(s) and annotations described with Web Annotation JSON-LD, or images listed in a IIIF presentation API manifest JSON-LD. You can add Web Annotations on those images.

JSON-LDで記述した画像アノテーション、もしくはIIIFプレゼンテーションAPIによるマニフェストJSON-LDを読み込んで画像と注釈を表示します。その画像の部分に対する注釈（Web Annotation）を追加することもできます。


## Requrement

- [OpenSeadragon](https://openseadragon.github.io/)
- [Annotorious](http://annotorious.github.io)


## Simple usage

The following is a sample head element to use image-annotator. Please download files with hyperlink from this site, along with OpenSeadragon and Annotorious. You can put those files anywhere in your site. Image path option for OpenSeadragon (prefixUrl) should be defined in Mia.prep_osd.osdoption within imgannot.js (button icons for Annotorious should be placed there).

```
<link rel="stylesheet" href="/lib/js/annot/annotorious.css" />
<link rel="stylesheet" href="/lib/js/my/imgannot.css" />
<script src="/lib/js/osd/openseadragon.js"></script>
<script src="/lib/js/annot/annotorious.min.js"></script>
<script src="/lib/js/my/annotext.js"></script>
<script src="/lib/js/my/webannotorious.js"></script>
<script src="/lib/js/my/imgannot.js"></script>
```

Place div element with id="openseadragon" in anywhere within body element. Mia.setup() will display manifest / web annotation / images given by u parameter.

```
<body onload="Mia.setup();">
<div id="openseadragon"></div>
</body>
```
