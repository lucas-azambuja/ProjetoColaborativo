﻿// canvas stuff

var canvas1 = new fabric.Canvas('draw-canvas');

window.addEventListener('resize', resizeCanvas, false);

function hexToRgb(hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

canvas1.on('object:modified', function (e) {
    SaveObject(e.target, false);
});

canvas1.on('object:removed', function (e) {
    SaveObject(e.target, true);
});

canvas1.on('path:created', function (e) {
    var id = uuid.v4();
    e.path.id = id;
    SaveObject(e.path, false);
});

function SaveObject(target, remover) {
    console.log(target);
    $.ajax({
        type: "POST",
        url: "",
        data: "{ 'guid' : '" + target.id + "', 'remover' : '" + remover + "', 'json' : '" + JSON.stringify(target.toJSON(['id'])) + "'}",
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        success: function (data) { console.log(data) },
        failure: function (errMsg) {
            alert(errMsg);
        }
    });
}

function resizeCanvas() {
    canvas1.setHeight(window.innerHeight);
    canvas1.setWidth(window.innerWidth);
    canvas1.calcOffset();
    canvas1.renderAll();
    $(".canvas-container").css("height", ""); // to show side panels
}
resizeCanvas();

function setCanvasBackground(url) {
    canvas1.setBackgroundImage(url, canvas1.renderAll.bind(canvas1), {
        width: canvas1.width,
        height: canvas1.height,
        originX: 'left',
        originY: 'top'
    });
}



/**
 DRAWING 
 */

var draw = false;
var drawingobject;

/**
 * SQUARE
 */
$("input[type='button'].icon-rect").click(function () {

    draw = true;
    var drawingobject;

    canvas1.on('mouse:down', function (option) {

        if (!draw) return false;

        if (typeof option.target != "undefined") {
            return false;
        } else {
            var startY = option.e.offsetY,
                startX = option.e.offsetX,
                id = uuid.v4();

            drawingobject = new fabric.Rect({
                top: startY,
                left: startX,
                width: 0,
                height: 0,
                fill: "rgba(" + hexToRgb(cordono).r + ", " + hexToRgb(cordono).g + ", " + hexToRgb(cordono).b + ", 0.5)",
                stroke: '',
                strokewidth: 0,
                id: id
            });
            
            canvas1.add(drawingobject);

            canvas1.on('mouse:move', function (option) {
                var e = option.e;
                drawingobject.set('width', e.offsetX - startX);
                drawingobject.set('height', e.offsetY - startY);
                drawingobject.setCoords();
                canvas1.renderAll();
            });
        }
    });

    canvas1.on('mouse:up', function () {
        draw = false;
        canvas1.off('mouse:move');
        canvas1.off('mouse:down');
        canvas1.off('mouse:up');
        SaveObject(drawingobject, false);
    });

});


/**
 * ELIPSE
 */
$("input[type='button'].icon-elipse").click(function () {

    draw = true;

    var drawingobject;

    canvas1.on('mouse:down', function (option) {

        if (!draw) return false;

        if (typeof option.target != "undefined") {
            return;
        } else {
            var startY = option.e.offsetY,
                startX = option.e.offsetX,
                id = uuid.v4();

            var pointer = canvas1.getPointer(option.e);

            drawingobject = new fabric.Ellipse({
                top: startY,
                left: startX,
                originX: 'left',
                originY: 'top',
                rx: pointer.x - startX,
                ry: pointer.y - startY,
                angle: 0,
                fill: "rgba(" + hexToRgb(cordono).r + ", " + hexToRgb(cordono).g + ", " + hexToRgb(cordono).b + ", 0.5)",
                stroke: '',
                strokewidth: 0,
                id: id
            });

            canvas1.add(drawingobject);

            canvas1.on('mouse:move', function (o) {
                var pointer = canvas1.getPointer(o.e);
                var rx = Math.abs(startX - pointer.x) / 2;
                var ry = Math.abs(startY - pointer.y) / 2;
                if (rx > drawingobject.strokeWidth) {
                    rx -= drawingobject.strokeWidth / 2;
                }
                if (ry > drawingobject.strokeWidth) {
                    ry -= drawingobject.strokeWidth / 2;
                }
                drawingobject.set({ rx: rx, ry: ry });

                if (startX > pointer.x) {
                    drawingobject.set({ originX: 'right' });
                } else {
                    drawingobject.set({ originX: 'left' });
                }
                if (startY > pointer.y) {
                    drawingobject.set({ originY: 'bottom' });
                } else {
                    drawingobject.set({ originY: 'top' });
                }
                drawingobject.setCoords();
                canvas1.renderAll();
            });
        }
    });

    canvas1.on('mouse:up', function () {
        draw = false;
        canvas1.off('mouse:move');
        canvas1.off('mouse:down');
        canvas1.off('mouse:up');
        SaveObject(drawingobject, false);
    });

});

/**
 * PENCIL
 */

$("input[type='button'].icon-pencil").click(function () {
    canvas1.isDrawingMode = true;

    canvas1.freeDrawingBrush.color = "rgba(" + hexToRgb(cordono).r + ", " + hexToRgb(cordono).g + ", " + hexToRgb(cordono).b + ", 0.5)";
    canvas1.freeDrawingBrush.width = 12;

    canvas1.on('mouse:up', function () {
        canvas1.isDrawingMode = false;
    });
});

// alert json
$("input[type='button'].icon-speaker").click(function () {
    alert(JSON.stringify(canvas1.toDatalessJSON()));
});

// delete
$('html').keyup(function (e) {
    if (e.keyCode == 46) {
        canvas1.getActiveObject().remove();
    }
});