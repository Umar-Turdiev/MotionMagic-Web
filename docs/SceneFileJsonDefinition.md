# Scene File Json Definition

## Format

### Basic Info

```
"scene_name": string,
"author": string,
"created_at": string,         // Format: YYYY-MM-DD HH:mm:ss
"last_modified_at": string,    // Format: YYYY-MM-DD HH:mm:ss
```

### Scene Settings

```
"scene_settings": 
{
  "gravity": { "x": float, "y": float , "unit": string },
  "time_step": float    // The interval (seconds) the simulator will step
}
```

### Objects

The list containing the objects in the scene.

```
"objects": {
    "id": {
         // Object properties
    },
    "id": {
         // Object properties
    },
    "id": {
         // Object properties
    },
}
```

### Object

#### Rectangle

```
{
    "id": int,
    "static": bool,
    "name": string,
    "type": "rectangle",
    "position": { "x": float, "y": float },
    "dimension": { "width": float, "height": float },
    "rotation": float,
    "mass": float,
    "friction": { "static": float, "kinetic": float },
    "linearVelocity": { "x": float, "y": float },
    "lengthUnit": string,
    "angleUnit": string,
    "massUnit": string,
    "linearVelocityUnit": string,
    "color": string,
    "border": string,
    "borderThickness": float    
},
```

#### Circle

```
{
    "id": int,
    "static": bool,
    "name": string,
    "type": "circle",
    "position": { "x": float, "y": float },
    "radius": float,
    "rotation": float,
    "mass": float,
    "friction": { "static": float, "kinetic": float },
    "linearVelocity": { "x": float, "y": float },
    "lengthUnit": string,
    "angleUnit": string,
    "massUnit": string,
    "linearVelocityUnit": string,
    "color": string,
    "border": string,
    "borderThickness": float
},
```

#### Polygon

```
{
    "id": int,
    "static": bool,
    "name": string,
    "type": "circle",
    "position": { "x": float, "y": float },
    "points": [
      { "x": float, "y": float },
      { "x": float, "y": float },
      { "x": float, "y": float }
    ],
    "rotation": { "value": float },
    "mass": float,
    "friction": { "static": float, "kinetic": float },
    "linearVelocity": { "x": float, "y": float },
    "lengthUnit": string,
    "angleUnit": string,
    "massUnit": string,
    "linearVelocityUnit": string,
    "color": string,
    "border": string,
    "borderThickness": float
},
```

### Example Scene

```
{
  "scene_name": "Test Scene",
  "author": "UT",
  "created_at": "2023-12-03 12:00:00",
  "last_modified_at": "2023-12-04 14:30:00",
  "settings": {
    "gravity": { "x": 0, "y": -9.81 },
    "time_step": 0.02
  },
  "objects": {
    "0": {
      "isStatic": false,
      "name": "Box",
      "objectType": "rectangle",
      "position": { "x": 640, "y": 374 },
      "dimension": { "width": 130, "height": 100 },
      "rotation": -21,
      "mass": 20,
      "friction": { "static": 0.3, "kinetic": 0.2 },
      "linearVelocity": { "x": 0, "y": 0 },
      "lengthUnit": "m",
      "angleUnit": "°",
      "massUnit": "kg",
      "linearVelocityUnit": "m/s",
      "fillColor": "#368BFF",
      "borderColor": "#2776E6",
      "borderThickness": 5
    },
    "1": {
      "isStatic": true,
      "name": "Ramp",
      "objectType": "polygon",
      "position": { "x": 550, "y": 600 },
      "points": [
        { "x": 0, "y": 250 },
        { "x": 650, "y": 250 },
        { "x": 650, "y": 0 }
      ],
      "rotation": 0,
      "mass": 0,
      "friction": { "static": 0.3, "kinetic": 0.2 },
      "linearVelocity": { "x": 0, "y": 0 },
      "lengthUnit": "m",
      "angleUnit": "°",
      "massUnit": "kg",
      "linearVelocityUnit": "m/s",
      "fillColor": "#FFFCBA",
      "borderColor": "#D6D08B",
      "borderThickness": 5
    },
    "2": {
      "isStatic": true,
      "name": "Floor",
      "objectType": "rectangle",
      "position": { "x": 0, "y": 500 },
      "dimension": { "width": 500, "height": 100 },
      "rotation": 0,
      "mass": 0,
      "friction": { "static": 0.3, "kinetic": 0.2 },
      "linearVelocity": { "x": 0, "y": 0 },
      "lengthUnit": "m",
      "angleUnit": "°",
      "massUnit": "kg",
      "linearVelocityUnit": "m/s",
      "fillColor": "#368BBB",
      "borderColor": "#2878A6",
      "borderThickness": 5
    },
    "3": {
      "isStatic": false,
      "name": "Ball",
      "objectType": "circle",
      "position": { "x": 640, "y": 0 },
      "radius": 40,
      "rotation": 0,
      "mass": 20,
      "friction": { "static": 0.3, "kinetic": 0.2 },
      "linearVelocity": { "x": 0, "y": 0 },
      "lengthUnit": "m",
      "angleUnit": "°",
      "massUnit": "kg",
      "linearVelocityUnit": "m/s",
      "fillColor": "#CCCCFF",
      "borderColor": "#A6A6F7",
      "borderThickness": 5
    }
  }
}
```
