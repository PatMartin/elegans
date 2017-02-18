define([
    "components/world",
    "components/space",
    "components/player",
    "components/menu",
    "utils/utils",
    "utils/range"
], function (World, Space, Player, Menu, Utils, Range) {
    function Stage(element, options) {
        this.options = {
            width: 600,
            height: 630,
            bg_color: 0xffffff,
            player: false,
            //space_mode: 'wireframe',
            range: {x: [0, 0], y: [0, 0], z: [0, 0]},
            autorange: true,
            perspective: true,
            orbit: false,
            save_image: false,
            space: {
                width: 500,
                height: 500,
                axis: {
                    labels: {
                        x: "X-Longer-Label", y: "Y-Longer-Label", z: "Z-Longer-Label"
                    },
                    labelOptions : {
                        fill: "rgb(255,0,0)",
                        height: 400,
                        width: 400,
                        scale: 8,
                        font: "60px sans-serif"
                    }
                },
                mode: 'wireframe',
                grid: true,
                numTicks: 5
            }
        };

        if (arguments.length > 1) {
            Utils.merge(this.options, options);
        }

        var selection = d3.select(element);
        selection.style("width", String(this.options.width));

        this.world_space = selection.append("div")
            .attr("id", "world")
            .attr("class", "world")
            .style({
                "float": "left",
                "width": String(this.options.space.width),
                "height": String(this.options.space.height),
                "save_image": this.options.save_image
            });

        this.legend_space = selection.append("div")
            .attr("id", "legend")
            .attr("class", "legend")
            .style({
                "float": "left",
                "width": String(this.options.width - this.options.space.width),
                "height": String(this.options.height)
            });

        if (this.options.player) {
            var player_space = selection.append("div")
                .style("width", String(this.options.width))
                .style("height", String(this.options.height - this.options.space.height));

            this.player = new Player(player_space, this);
        }

        if (this.options.save_image) {
            this.menu = new Menu(this.world_space);
        }

        this.charts = [];

        this.world = new World({
            width: this.options.space.width,
            height: this.options.space.height,
            bg_color: this.options.bg_color,
            perspective: this.options.perspective,
            orbit: this.options.orbit
        });

        this.data_ranges = {
            x: new Range(this.options.range.x[0], this.options.range.x[1]),
            y: new Range(this.options.range.y[0], this.options.range.y[1]),
            z: new Range(this.options.range.z[0], this.options.range.z[1])
        };

        return this;
    }

    Stage.prototype.add = function (chart) {
        if (this.options.autorange) {
            var ranges = chart.getDataRanges();
            var thisObj = this;
            ['x', 'y', 'z'].forEach(function (i) {
                thisObj.data_ranges[i] = Range.expand(thisObj.data_ranges[i], ranges[i]);
            });
        }
        this.charts.push(chart);
    };

    Stage.prototype.render = function () {
        this.space = new Space(this.data_ranges, this.options.space);
        this.world.addMesh(this.space.getMeshes());
        for (var i = 0; i < this.charts.length; i++) {
            var chart = this.charts[i];
            chart.generateMesh(this.space.getScales(), this);
            this.world.addMesh(chart.getMesh());
            if (chart.hasLegend()) {
                var legend = chart.getLegend();
                this.legend_space[0][0].appendChild(legend[0][0]);
            }
        }

        if (this.options.player) {
            this.player.render();
        }

        this.world.begin(this.world_space);
        if (this.options.save_image) this.menu.begin();
    };

    Stage.prototype.dispose = function () {
        this.clear();
        this.world.renderer.clear();
    };

    Stage.prototype.clear = function () {
        for (var i = 0; i < this.charts.length; i++) {
            var chart = this.charts[i];
            this.world.removeMesh(chart.getMesh());
        }
    };

    Stage.prototype.update = function () {
        for (var i = 0; i < this.charts.length; i++) {
            var chart = this.charts[i];
            chart.generateMesh(this.space.getScales(), this);
            this.world.addMesh(chart.getMesh());
        }
    };

    return Stage;
});
