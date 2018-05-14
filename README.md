# chartist-hover

Chartist plugin that adds a hover event to each point, slice or bar on your chart.

## Install

### Yarn

```
yarn add chartist-hover
```

### npm

```
npm install chartist-hover
```

### Global

```html
<script src="https://your-domain.com/chartist-hover.js"></script>
```

## Usage

```javascript
var chart = new Chartist.Line(
  ".ct-chart",
  {
    labels: [1, 2, 3, 4, 5, 6, 7],
    series: [[1, 5, 3, 4, 6, 2, 3], [2, 4, 2, 5, 4, 3, 6]]
  },
  {
    plugins: [
      Chartist.plugins.hover({
        onMouseEnter: () => null,
        onMouseLeave: () => null,
        id: null
      })
    ]
  }
);
```
