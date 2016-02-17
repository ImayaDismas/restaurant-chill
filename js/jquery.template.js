$(function() {
	var	$home_page_menu			= $('#home_page_menu'),
		$home_menu_items			= $home_page_menu.find('a'),
		$home_container			= $('#home_container'),
		$home_pages				= $home_container.children('.home_page'),
		$pageTitle				= $home_page_menu.children('.title'),
		$home_dishes				= $('#home_dishes > li > a'),
		
		$home_background			= $('#home_background'),
		$bg_image				= $home_background.children('img'),
		$home_overlay				= $home_background.children('.home_overlay'),
		$home_prev				= $('#home_prev'),
		$home_next				= $('#home_next'),
		$home_close				= $('#home_close'),
		$home_gallery				= $('#home_gallery'),
		$home_gallery_wrapper		= $home_gallery.children('.home_gallery_wrapper'),
		$home_items				= $home_gallery_wrapper.find('.home_gallery_item'),
		total_items				= $home_items.length,
		
		BGMap					= (function() {
			var map,
				$mapEl		= $('#map'),
				address		= 'Fondamenta Beata Giuliana 4, Venezia',
				lat			= 45.428688849691014,
				lng			= 12.317744493484497,
				display		= false,
				
				showMap		= function() {
					hideMap();
					
					display 		= true;
					
					var point 		= new google.maps.LatLng(lat,lng),
						mapOptions 	= {
							zoom						: 18,
							center						: point,
							mapTypeId					: google.maps.MapTypeId.HYBRID,
							mapTypeControl				: false,
							panControl					: true,
							panControlOptions			: {
								position	: google.maps.ControlPosition.TOP_RIGHT
							},
							zoomControl					: true,
							zoomControlOptions			: {
								style		: google.maps.ZoomControlStyle.SMALL,
								position	: google.maps.ControlPosition.TOP_RIGHT
							},
							streetViewControl			: true,
							streetViewControlOptions	: {
								position	: google.maps.ControlPosition.TOP_RIGHT
							}
						};
					
					map 			= new google.maps.Map(document.getElementById("map"), mapOptions);
					//rotate 45 degrees (nicer view!)
					map.setTilt(45);
					
					resizeMap();
					
					var coordInfoWindow = new google.maps.InfoWindow({maxWidth : 10}),   
						latlngStr 		= address + "<br />LatLng: " + lat + " , " + lng + "<br />";
					
					coordInfoWindow.setContent(latlngStr);    
					coordInfoWindow.setPosition(point);    
					coordInfoWindow.open(map);
					
					BGImageController.fadeBG(false);
				},
				resizeMap	= function() {
					$mapEl.css({
						width	: $(window).width() + 'px',
						height	: $(window).height() + 'px'
					});
				},
				hideMap		= function() {
					display = false;
					$mapEl.empty();
				},
				active		= function() {
					return display;
				};
				
			return {
				showMap		: showMap,
				hideMap		: hideMap,
				active		: active,
				resizeMap	: resizeMap
			};
		})(),
		
		BGImageController		= (function() {
			var changeBgImageDim	= function() {
					var dim	= getImageDim($bg_image);
					//set the returned values and show the image
					$bg_image.css({
						width	: dim.width + 'px',
						height	: dim.height + 'px',
						left	: dim.left + 'px',
						top		: dim.top + 'px'
					});
					if(!BGMap.active())
						$bg_image.fadeIn(1500);
				},
				//get dimentions of the image,
				//in order to make it full size and centered
				getImageDim				= function($i){
					var $img     = new Image();
					$img.src     = $i.attr('src');
							
					var w_w	= $(window).width(),
					w_h	= $(window).height(),
					r_w	= w_h / w_w,
					i_w	= $img.width,
					i_h	= $img.height,
					r_i	= i_h / i_w,
					new_w,new_h,
					new_left,new_top;
							
					if(r_w > r_i){
						new_h	= w_h;
						new_w	= w_h / r_i;
					}
					else{
						new_h	= w_w * r_i;
						new_w	= w_w;
					}
							
					return {
						width	: new_w,
						height	: new_h,
						left	: (w_w - new_w) / 2,
						top		: (w_h - new_h) / 2
					};
							
				},
				fadeBG					= function(dir) {
					return $.Deferred(
						function(dfd) {
							(dir) ? $home_background.fadeIn(1000, dfd.resolve) : $home_background.fadeOut(15000, dfd.resolve);
						}
					).promise();
				},
				/* preloads a set of images */
				preloadImages			= function() {
					return $.Deferred(
						function(dfd) {
							var Images = new Array();
							
							$home_items.each(function(i) {
								var $item 		= $(this),
								$itemImg		= $item.children('img'),
								itemImgSrc		= $itemImg.attr('src'),
								itemBgImgSrc	= $itemImg.data('bgimg');
								Images.push(itemImgSrc);
								Images.push(itemBgImgSrc);
							});
										
							var total_images 	= Images.length,
							loaded			= 0;
							for(var i = 0; i < total_images; ++i){
								$('<img/>').load(function() {
									++loaded;
									if(loaded === total_images)
										dfd.resolve();
								}).attr('src' , Images[i]);
							}
						}
					).promise();
				};
			
			return {
				changeBgImageDim	: changeBgImageDim,
				getImageDim			: getImageDim,
				preloadImages		: preloadImages,
				fadeBG				: fadeBG
			};
		})(),
		
		BGSlider				= (function() {
			var animated				= false,
				animSpeed				= 700,
				current					= 0,
				defaultImage			= 'img/background/default.jpg',
				
				init					= function(position) {
					initEventsHandler();
					slider(position);
				},
				stop					= function() {
					$(document).unbind('mousewheel keydown');
					$home_prev.unbind('click');
					$home_next.unbind('click');
					$home_close.unbind('click');
					$home_items.children('img').unbind('click');
				},
				light					= function(speed, val, hide) {
					$home_overlay.stop().fadeTo(speed, val, function() {
						if(hide)
							$home_overlay.hide();	
					});
				},
				initEventsHandler		= function() {
					$home_prev.bind('click', function(e) {
						navigate(0);
						return false;
					});
							
					$home_next.bind('click', function(e) {
						navigate(1);
						return false;
					});
					
					$home_close.bind('click', function(e) {
						
						hideNavigation();
						
						light(500, 0.5);
						
						var $home_item_current	= $home_items.eq(current),
							$heading			= $home_item_current.children('.home_heading'),
							$desc				= $home_item_current.children('.home_desc');
						
						animated = true;
						
						stop();
						
						$.when(animateHeadingDesc($heading, $desc, 0)).done(function(){
							$home_items.css('left','-20px').hide();
							Template.reset();
							replaceBGImage(defaultImage);
						});
						
						return false;
					});
					
					$home_items.children('img').bind('click', function() {
						$home_gallery_wrapper.fadeOut();
						light(500, 0, true);
					});
					
					/*
					mousewheel events - down / up button trigger the navigate
					key events - down / up button trigger the navigate
					 */
					$(document).bind('mousewheel', function(e, delta) {
						if(delta > 0)
							navigate(0);
						else
							navigate(1);
						return false;
					}).keydown(function(e){
						switch(e.which){
							case 37:
								navigate(0);
								break;
							case 39:
								navigate(1);
								break;
						}
					});
				},
				slider					= function(position) {
					$home_gallery_wrapper.show();
					
					showNavigation();
					
					$home_items.eq(position).show();
					
					light(500, 0.8);
					
					//show heading and description of current / first image
					current	= position;
					
					var $home_item_current	= $home_items.eq(current),
						$heading			= $home_item_current.children('.home_heading'),
						$desc				= $home_item_current.children('.home_desc');
					
					animated = true;
					replaceBGImage($home_item_current.children('img').data('bgimg'));
					
					animateHeadingDesc($heading, $desc, 1);	
				},
				showNavigation			= function() {
					$home_prev.stop().animate({left : '10px'},animSpeed);
					$home_next.stop().animate({right : '10px'},animSpeed);
				},
				hideNavigation			= function() {
					$home_prev.stop().animate({left : '-72px'},animSpeed);
					$home_next.stop().animate({right : '-72px'},animSpeed);
				},
				exitFullscreen			= function() {
					$home_gallery_wrapper.fadeIn();
					light(500, 0.8);
				},
				animateHeadingDesc		= function($heading, $desc, dir) {
					return $.Deferred(
						function(dfd) {
							var paramHeading	= {},
							paramDesc		= {};
										
							if(dir) {
								paramHeading.left	= '-10px';
								paramHeading.top	= '-10px';
								paramDesc.right		= '0px';
								paramDesc.bottom	= '0px';
							} else {
								paramHeading.left	= '20px';
								paramHeading.top	= '95px';
								paramDesc.right		= '40px';
								paramDesc.bottom	= '95px';
							}
							$heading.stop().animate(paramHeading, animSpeed/3);
							$desc.stop().animate(paramDesc, animSpeed/3, dfd.resolve);
						}
					).promise();
				},
				navigate				= function(dir) {
					if(animated) return false;
							
					animated = true;
								
					$home_item_current	= $home_items.eq(current);
							
					(dir) ? ++current : --current;
							
					if(current > total_items - 1)
						current = 0;
					else if(current < 0)
						current = total_items - 1;
						
					//the next item is:
					var $next_item			= $home_items.eq(current),
							
					//1 step : hide heading and description of current image
					$headingCurrent	= $home_item_current.children('.home_heading'),
					$descCurrent	= $home_item_current.children('.home_desc');
					
					
					$.when(animateHeadingDesc($headingCurrent, $descCurrent, 0)).done(function(){
						//2 step : home_gallery_wrapper overflow hidden
						$home_gallery_wrapper.css('overflow', 'hidden');
								
						//3 step : position next image on the right side
						var	startingLeft	= (dir) ? '480px' : '-520px',
						currentEndingLeft	= (dir) ? '-520px' : '480px';
								
						$next_item.css('left', startingLeft).show();
								
						//4 step : animate current one to the left side, and next one to the center
						$home_item_current.stop().animate({
							left	: currentEndingLeft
						}, animSpeed);
						
						$next_item.stop().animate({
							left	: '-20px'
						}, animSpeed, function() {
							$home_item_current.hide();
							$home_gallery_wrapper.css('overflow', 'visible');
							var $heading	= $next_item.children('.home_heading'),
								$desc		= $next_item.children('.home_desc');
									
							$.when(animateHeadingDesc($heading, $desc, 1)).done(function(){
								animated = false;
							});
						});
								
						animateBGImage(dir, $next_item);
					});
					
				},
				animateBGImage			= function(dir, $next_item) {
					//animate bg image
					var $next_item_bgimage	= $('<img src="' + $next_item.children('img').data('bgimg') + '" alt="image' + (current + 1) + '" ></img>'),
						dim					= BGImageController.getImageDim($next_item_bgimage),
								
						starting_left		= (dir) ? $(window).width() : -dim.width + 'px';
							
					//set the returned values and show the image
					$next_item_bgimage.css({
						width	: dim.width + 'px',
						height	: dim.height + 'px',
						left	: starting_left,
						top		: dim.top + 'px'
					}).insertAfter($bg_image).stop().animate({
						left	: dim.left + 'px'
					}, animSpeed);;
							
					var ending_left			= (dir) ? -$bg_image.width() : $(window).width();
							
					$bg_image.stop().animate({
						left	: ending_left + 'px'
					}, animSpeed, function() {
						$(this).remove();
						$bg_image 	= $next_item_bgimage;
						animated 	= false;
					});
				},
				replaceBGImage			= function(image) {
					var $next_bgimage	= $('<img src="' + image + '" alt="image' + (current + 1) + '" ></img>'),
						dim				= BGImageController.getImageDim($next_bgimage);
							
					//set the returned values and show the image
					$next_bgimage.css({
						width	: dim.width + 'px',
						height	: dim.height + 'px',
						left	: dim.left,
						top		: dim.top + 'px'
					}).insertBefore($bg_image);
							
					$bg_image.stop().fadeOut(animSpeed*2, function() {
						$(this).remove();
						$bg_image 	= $next_bgimage;
						animated 	= false;
					});
				};
				
			return {
				init			: init,
				stop			: stop,
				exitFullscreen	: exitFullscreen
			};
		})(),
		
		Template				= (function() {
			var animSpeed				= 700,
			
				init					= function() {
					//preloads all the bg images for the slider
					BGImageController.preloadImages();
					//$.when( loadImages() ).done(function(){
					BGImageController.changeBgImageDim();
					initEventsHandler();
					
					//});
				},
				initEventsHandler		= function() {
				
					$home_menu_items.bind('click', function(e) {
						var $item	= $(this);
						
						hidePageContent();
						
						var item	= $(this).data('content');
						if(item === 'visit') {
							BGMap.showMap();
						} else{
							$.when( BGImageController.fadeBG(true) ).done(function(){
								BGMap.hideMap();
							});
							$('#' + $item.data('content')).show();
						}	
						return false;
					});
					
					$home_dishes.bind('click', function(e) {
						initPhotoSlider($(this).parent('li').index());
						return false;
					});
					
					//resizing the window resizes the $bg_image
					$(window).bind('resize',function(e){
						BGImageController.changeBgImageDim();
						BGMap.resizeMap();
					});
					
					$home_background.delegate('img', 'click', function(e) {
						BGSlider.exitFullscreen();
						return false;
					});
					
				},
				hidePageContent			= function() {
					$home_pages.hide();
					// BGSlider.stop();
				},
				initPhotoSlider			= function(position) {
					//initialize the photos slider
					BGSlider.init(position);
					//hide the photo thumbs and show the slider section
					$home_gallery.show().siblings().fadeOut(animSpeed/2);
					//hide the page navigation menu
					togglePageMenu(false);
				},
				togglePageMenu			= function(dir) {
					(dir) ? 
					$home_page_menu.stop().animate({left:'0px'}, animSpeed) : 
					$home_page_menu.stop().animate({left:'-300px'}, animSpeed);
				},
				reset					= function() {
					$home_gallery.hide().siblings().fadeIn(animSpeed);
					togglePageMenu(true);
				};
				
			return {
				init 			: init,
				reset			: reset
			};
		})();

	Template.init();
});