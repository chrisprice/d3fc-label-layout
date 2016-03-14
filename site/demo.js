/* global d3 fc */

var labelPadding = 4;
var label = fc.layout.textLabel()
    .padding(labelPadding)
    .value(function(d) { return d.data; });

var width = 700;
var height = 350;
var itemWidth = 60;
var itemHeight = 20;
var strategy = fc.layout.strategy.annealing();
var data = [];

function generateData() {
    var dataCount = document.getElementById('label-count').value;
    data = d3.range(0, dataCount)
        .map(function(d, i) {
            return {
                x: Math.random() * width,
                y: Math.random() * height,
                data: 'node-' + i
            };
        });
}

var svg = d3.select('svg')
        .attr('width', width)
        .attr('height', height);

function render() {
    var labels = fc.layout.label(strategy)
        .size(function() {
            var textSize = d3.select(this)
              .select('text')
              .node()
              .getBBox();
            return [textSize.width + labelPadding * 2, textSize.height + labelPadding * 2];
        })
        .component(label);

    svg.selectAll('g').remove();
    svg.append('g')
        .datum(data)
        .call(labels);
}

function getStrategyName() {
    var selector = document.getElementById('strategy-selector');
    return selector.options[selector.selectedIndex].value;
}

d3.select('#strategy-selector')
    .on('change', function() {
        var strategyName = getStrategyName();
        d3.selectAll('.annealing-field')
            .attr('style', 'display:' + (strategyName === 'annealing' ? 'visible' : 'none'));
    });

d3.select('#strategy-form .btn')
    .on('click', function() {
        d3.event.preventDefault();
        var strategyName = getStrategyName();
        strategy = function(d) { return d; };
        if (strategyName !== 'none') {
            strategy = fc.layout.strategy[strategyName]();
        }
        if (strategyName === 'annealing') {
            strategy.temperature(document.getElementById('temperature').value);
            strategy.cooling(document.getElementById('cooling').value);
        }
        render();
    });

d3.select('#labels-form .btn')
    .on('click', function() {
        d3.event.preventDefault();
        generateData();
        render();
    });

generateData();
render();
