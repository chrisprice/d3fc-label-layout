# d3fc-label-layout

A D3 layout that places labels avoiding overlaps, with strategies including simulated annealing, greedy and local.

![d3fc label layout](d3fc-label-layout.png)

For a live demo, see the [GitHub Pages site](http://colineberhardt.github.io/d3fc-label-layout/).

[Main d3fc package](https://github.com/ScottLogic/d3fc)

# Installation

```bash
npm install d3fc-label-layout
```

# API

## General API

The label layout component provides a mechanism for arranging child components based on their rectangular bounding boxes. It is typically used to render labels on maps or charts. A layout strategy is passed to the component in order to arrange the child rectangles avoiding collisions or remove overlaps.

### Example usage

```javascript
var labelPadding = 2;

// rather than using a component, a text element is appended directly
var label = function(sel) {
    sel.append('text')
      .text(function(d) { return d.properties.name; })
      .attr({
        'dy': '0.7em',
        'transform': 'translate(' + labelPadding + ', ' + labelPadding +')'
      });
};

var strategy = fc.layout.strategy.removeOverlaps(fc.layout.strategy.greedy());

// create the layout that positions the labels
var labels = fc.layout.label(strategy)
    .size(function(d) {
        // measure the label and add the required padding
        var textSize = d3.select(this)
            .select('text')
            .node()
            .getBBox();
        return [textSize.width + labelPadding * 2, textSize.height + labelPadding * 2];
    })
    .position(function(d) { return projection(d.geometry.coordinates); })
    .component(label);

svg.datum(places.features)
     .call(labels);
```
