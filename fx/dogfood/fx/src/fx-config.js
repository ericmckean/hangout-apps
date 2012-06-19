var configData = {
  type: "Application",
  name: "Effects",
  localizationID: "Effects",
  children: [
    {
      type: "Category",
      name: "Headwear",
      localizationID: "Headwear",
      children: [
        {
          type: "FaceTrackingVideoOverlay",
          name: "Cat Hat",
          localizationID: "Cat_Hat",
          icon: gResourceRoot + 'fx/overlays/Dr.Seuss_hat-large-icon.png',
          overlay: gOverlayRoot + 'fx/overlays/Dr.Seuss_hat.png',
          exclusionTags: 'overhead,forehead',
          yOffset: -0.7,
          scale: 0.7
        },
        {
          type: "FaceTrackingVideoOverlay",
          name: "Crown",
          localizationID: "Crown",
          icon: gResourceRoot + 'fx/overlays/Crown-large-icon.png',
          overlay: gOverlayRoot + 'fx/overlays/Crown.png',
          exclusionTags: 'forehead,overhead',
          yOffset: -0.9,
          scale: 0.65
        },
        {
          type: "FaceTrackingVideoOverlay",
          name: "Tiara",
          localizationID: "Tiara",
          icon: gResourceRoot + 'fx/overlays/Tiara-large-icon.png',
          overlay: gOverlayRoot + 'fx/overlays/Tiara.png',
          exclusionTags: 'forehead',
          yOffset: -0.9,
          scale: 0.65
        },
        {
          type: "FaceTrackingVideoOverlay",
          name: "Pirate Hat",
          localizationID: "Pirate_Hat",
          icon: gResourceRoot + 'fx/overlays/PirateHat-large-icon.png',
          overlay: gOverlayRoot + 'fx/overlays/PirateHat.png',
          exclusionTags: 'forehead,overhead',
          yOffset: -0.2,
          scale: 0.8
        },
        {
          type: "FaceTrackingVideoOverlay",
          name: "Clown Head",
          localizationID: "Clown_Head",
          icon: gResourceRoot + 'fx/overlays/Clownhead-large-icon.png',
          overlay: gOverlayRoot + 'fx/overlays/Clownhead.png',
          exclusionTags: 'forehead',
          yOffset: -0.5,
          scale: 0.8
        },
        {
          type: "FaceTrackingVideoOverlay",
          name: "Sweatband",
          localizationID: "Sweatband",
          icon: gResourceRoot + 'fx/overlays/Sweatband-large-icon.png',
          overlay: gOverlayRoot + 'fx/overlays/Sweatband.png',
          exclusionTags: 'forehead',
          yOffset: -0.52,
          scale: 0.7
        },
	/*        {
          type: "FaceTrackingVideoOverlay",
          name: "Top Hat",
          localizationID: "Top_Hat",
          icon: gResourceRoot + 'fx/overlays/topHat-large-icon.png',
          overlay: gOverlayRoot + 'fx/overlays/topHat.png',
          exclusionTags: 'head',
          xOffset: -0.02,
          yOffset: -0.9,
          scale: 0.9
	  },*/
        {
          type: "FaceTrackingVideoOverlay",
          name: "Birthday Hat",
          localizationID: "Birthday_Hat",
          icon: gResourceRoot + 'fx/overlays/Birthday_hat-large-icon.png',
          overlay: gOverlayRoot + 'fx/overlays/Birthday_hat.png',
          exclusionTags: 'forehead,overhead',
          xOffset: -0.02,
          yOffset: -1.0,
          scale: 0.8
        },
        {
          type: "FaceTrackingVideoOverlay",
          name: "Halo",
          localizationID: "Halo",
          icon: gResourceRoot + 'fx/overlays/halo-large-icon.png',
          overlay: gOverlayRoot + 'fx/overlays/halo.png',
          exclusionTags: 'halo-horns,overhead',
          yOffset: -0.82,
        },
        {
          type: "FaceTrackingVideoOverlay",
          name: "Horns",
          localizationID: "Horns",
          icon: gResourceRoot + 'fx/overlays/horns-large-icon.png',
          overlay: gOverlayRoot + 'fx/overlays/horns.png',
          exclusionTags: 'halo-horns,overhead',
          yOffset: -0.65,
          scale: 0.7
        },
        {
          type: "FaceTrackingVideoOverlay",
          name: "Hearts",
          localizationID: "Hearts",
          icon: gResourceRoot + 'fx/overlays/Hearts-large-icon.png',
          overlay: gOverlayRoot + 'fx/overlays/Hearts.png',
          exclusionTags: 'accent',
          yOffset: -1.05
        },
        {
          type: "FaceTrackingVideoOverlay",
          name: "Confused",
          localizationID: "Confused",
          icon: gResourceRoot + 'fx/overlays/Confused-large-icon.png',
          overlay: gOverlayRoot + 'fx/overlays/Confused.png',
          exclusionTags: 'accent',
          yOffset: -0.6
        },
        {
          type: "FaceTrackingVideoOverlay",
          name: "Mohawk",
          localizationID: "Mohawk",
          icon: gResourceRoot + 'fx/overlays/Mohawk-large-icon.png',
          overlay: gOverlayRoot + 'fx/overlays/Mohawk.png',
          exclusionTags: 'forehead,overhead',
          yOffset: -1.0,
          scale: 0.7
        },
        {
          type: "FaceTrackingVideoOverlay",
          name: "Dog",
          localizationID: "Dog",
          icon: gResourceRoot + 'fx/overlays/dog-large-icon.png',
          overlay: gOverlayRoot + 'fx/overlays/dog.png',
          exclusionTags: 'face',
          yOffset: -0.04,
          scale: 0.7
        },
        {
          type: "FaceTrackingVideoOverlay",
          name: "Cat",
          localizationID: "Cat",
          icon: gResourceRoot + 'fx/overlays/cat-large-icon.png',
          overlay: gOverlayRoot + 'fx/overlays/cat.png',
          exclusionTags: 'face',
          yOffset: -0.35,
          scale: 0.7
        }
      ]
    },
    {
      type: "Category",
      name: "Eyewear",
      localizationID: "Eyewear",
      children: [
        {
          type: "FaceTrackingVideoOverlay",
          name: "Sunglasses",
          localizationID: "Sunglasses",
          icon: gResourceRoot + 'fx/overlays/Sunglasses-large-icon.png',
          overlay: gOverlayRoot + 'fx/overlays/Sunglasses.png',
          exclusionTags: 'left-eye,right-eye',
          yOffset: 0.03,
          scale: 0.8
        },
        {
          type: "FaceTrackingVideoOverlay",
          name: "Monocle",
          localizationID: "Monocle",
          icon: gResourceRoot + 'fx/overlays/Monacle-large-icon.png',
          overlay: gOverlayRoot + 'fx/overlays/Monacle.png',
          exclusionTags: 'left-eye',
          faceTrackingFeature: gapi.hangout.av.effects.FaceTrackingFeature.LEFT_EYE,
          xOffset: -0.01,
          yOffset: 0.3,
          scale: 0.8
        },
        {
          type: "FaceTrackingVideoOverlay",
          name: "Eye Patch",
          localizationID: "Eye_Patch",
          icon: gResourceRoot + 'fx/overlays/Eyepatch-large-icon.png',
          overlay: gOverlayRoot + 'fx/overlays/Eyepatch.png',
          exclusionTags: 'right-eye',
          yOffset: -0.08,
          scale: 0.7
        },
        {
          type: "FaceTrackingVideoOverlay",
          name: "Scuba Mask",
          localizationID: "Scuba_Mask",
          icon: gResourceRoot + 'fx/overlays/ScubaMask-large-icon.png',
          overlay: gOverlayRoot + 'fx/overlays/ScubaMask.png',
          exclusionTags: 'left-eye,right-eye',
          xOffset: 0.06,
          yOffset: 0.1,
          scale: 0.75
        },
	/*        {
          type: "FaceTrackingVideoOverlay",
          name: "Thick Rimmed",
          localizationID: "Thick_Rimmed",
          icon: gResourceRoot + 'fx/overlays/glasses-large-icon.png',
          overlay: gOverlayRoot + 'fx/overlays/glasses.png',
          exclusionTags: 'eye',
          yOffset: 0.05,
          scale: 0.4
	  }*/
      ]
    },
    {
      type: "Category",
      name: "Facial Hair",
      localizationID: "Facial_Hair",
      children: [
        {
          type: "FaceTrackingVideoOverlay",
          name: "Beard",
          localizationID: "Beard",
          icon: gResourceRoot + 'fx/overlays/Beard-large-icon.png',
          overlay: gOverlayRoot + 'fx/overlays/Beard.png',
          exclusionTags: 'moustache,beard',
          faceTrackingFeature: gapi.hangout.av.effects.FaceTrackingFeature.UPPER_LIP,
          yOffset: -0.05,
          scale: 0.75
        }, 
        {
          type: "FaceTrackingVideoOverlay",
          name: "Goatee",
          localizationID: "Goatee",
          icon: gResourceRoot + 'fx/overlays/Goatee-large-icon.png',
          overlay: gOverlayRoot + 'fx/overlays/Goatee.png',
          exclusionTags: 'beard',
          faceTrackingFeature: gapi.hangout.av.effects.FaceTrackingFeature.LOWER_LIP,
          yOffset: 0.2,
          scale: 0.8
        }, 
        {
          type: "FaceTrackingVideoOverlay",
          name: "Handlebar Mustache",
          localizationID: "Handlebar_Mustache",
          icon: gResourceRoot + 'fx/overlays/Moustache_Handlebars-large-icon.png',
          overlay: gOverlayRoot + 'fx/overlays/Moustache_Handlebars.png',
          exclusionTags: 'moustache',
          faceTrackingFeature: gapi.hangout.av.effects.FaceTrackingFeature.UPPER_LIP,
          yOffset: -0.04,
          scale: 0.6
        }, 
        {
          type: "FaceTrackingVideoOverlay",
          name: "Bushy Mustache",
          localizationID: "Bushy_Mustache",
          icon: gResourceRoot + 'fx/overlays/Moustache_bushy-large-icon.png',
          overlay: gOverlayRoot + 'fx/overlays/Moustache_bushy.png',
          exclusionTags: 'moustache',
          faceTrackingFeature: gapi.hangout.av.effects.FaceTrackingFeature.UPPER_LIP,
          yOffset: -0.03,
          scale: 0.6
        }, 
	/*        {
          type: "FaceTrackingVideoOverlay",
          name: "Thin Mustache",
          localizationID: "Thin_Mustache",
          icon: gResourceRoot + 'fx/overlays/stache1-large-icon.png',
          overlay: gOverlayRoot + 'fx/overlays/stache1.png',
          exclusionTags: 'moustache',
          yOffset: 0.25,
          scale: 0.6
        }, 
        {
          type: "FaceTrackingVideoOverlay",
          name: "Handlebar Mustache",
          localizationID: "Handlebar_Mustache",
          icon: gResourceRoot + 'fx/overlays/stache2-large-icon.png',
          overlay: gOverlayRoot + 'fx/overlays/stache2.png',
          exclusionTags: 'moustache',
          yOffset: 0.25,
          scale: 0.6
        }, 
        {
          type: "FaceTrackingVideoOverlay",
          name: "Weird Mustache",
          localizationID: "Weird_Mustache",
          icon: gResourceRoot + 'fx/overlays/stache3-large-icon.png',
          overlay: gOverlayRoot + 'fx/overlays/stache3.png',
          exclusionTags: 'moustache',
          yOffset: 0.25,
          scale: 0.6
        }, 
        {
          type: "FaceTrackingVideoOverlay",
          name: "Dapper Mustache",
          localizationID: "Dapper_Mustache",
          icon: gResourceRoot + 'fx/overlays/stache4-large-icon.png',
          overlay: gOverlayRoot + 'fx/overlays/stache4.png',
          exclusionTags: 'moustache',
          yOffset: 0.25,
          scale: 0.6
	  }*/
      ]
    },
    {
      type: "Category",
      name: "Props",
      localizationID: "Props",
      children: [
        {
          type: "FaceTrackingVideoOverlay",
          name: "Birthday Cake",
          localizationID: "Birthday_Cake",
          icon: gResourceRoot + 'fx/overlays/Birthday_cake-large-icon.png',
          overlay: gOverlayRoot + 'fx/overlays/Birthday_cake.png',
          exclusionTags: 'props',
          faceTrackingFeature: gapi.hangout.av.effects.FaceTrackingFeature.UPPER_LIP,
          yOffset: 1.6,
          scale: 0.45,
          rotateWithFace: false,
          scaleWithFace: false
        }
      ]
    }        
  ]
};

setEffectsAppConfig(configData);
