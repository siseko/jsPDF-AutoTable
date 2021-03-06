/**
 * Ratio between font size and font height. The number comes from jspdf's source code
 */
export let FONT_ROW_RATIO = 1.15;
import {Table} from './models';

let table: Table = null;

declare function require(path: string): any;
var assign = require('object-assign');
var entries = require('object.entries');

/**
 * Styles for the themes (overriding the default styles)
 */
export let getTheme = function(name) {
    let themes = {
        'striped': {
            table: {fillColor: 255, textColor: 80, fontStyle: 'normal'},
            header: {textColor: 255, fillColor: [41, 128, 185], fontStyle: 'bold'},
            body: {},
            alternateRow: {fillColor: 245}
        },
        'grid': {
            table: {fillColor: 255, textColor: 80, fontStyle: 'normal', lineWidth: 0.1},
            header: {textColor: 255, fillColor: [26, 188, 156], fontStyle: 'bold', lineWidth: 0},
            body: {},
            alternateRow: {}
        },
        'plain': {
            header: {fontStyle: 'bold'}
        }
    };
    return themes[name];
};

export function getDefaults() {
    return {
        // Styling
        theme: 'striped', // 'striped', 'grid' or 'plain'
        styles: {},
        headerStyles: {},
        bodyStyles: {},
        alternateRowStyles: {},
        columnStyles: {},
        
        // Content
        head: null,
        body: null,
        fromHtml: null,
        includeHiddenHtml: false,
        useCssStyles: false,

        // Properties
        startY: false, // false indicates the margin top value
        margin: 40 / table.scaleFactor,
        pageBreak: 'auto', // 'auto', 'avoid', 'always'
        tableWidth: 'auto', // 'auto'|'wrap'|number (takes precedence over columnWidth style if conflict)
        showHeader: 'everyPage', // 'everyPage', 'firstPage', 'never',
        tableLineWidth: 0,
        tableLineColor: 200,
        tableId: null,
        eventHandler: null,

        // Hooks
        createdHeaderCell: function (cell, data) {},
        createdCell: function (cell, data) {},
        drawHeaderRow: function (row, data) {},
        drawRow: function (row, data) {},
        drawHeaderCell: function (cell, data) {},
        drawCell: function (cell, data) {},
        addPageContent: function (data) {}
    }
}

// Base style for all themes
function defaultStyles() {
    return {
        font: "helvetica", // helvetica, times, courier
        fontStyle: 'normal', // normal, bold, italic, bolditalic
        overflow: 'ellipsize', // visible, hidden, ellipsize or linebreak
        fillColor: false, // Either false for transparent, rbg array e.g. [255, 255, 255] or gray level e.g 200
        textColor: 20,
        halign: 'left', // left, center, right
        valign: 'top', // top, middle, bottom
        fontSize: 10,
        cellPadding: 5 / table.scaleFactor, // number or {top,left,right,left,vertical,horizontal}
        lineColor: 200,
        lineWidth: 0 / table.scaleFactor,
        columnWidth: 'auto',
        minCellHeight: 0
    }
}

export class Config {
    
    static pageSize() {
        return table.doc.internal.pageSize;
    }
    
    static applyUserStyles() {
        Config.applyStyles(table.userStyles);
    }
    
    static createTable(doc) {
        table = new Table(doc);
        return table;
    }
    
    static tableInstance(): Table {
        return table;
    }
    
    // This is messy, only keep array and number format the next major version
    static marginOrPadding(value, defaultValue: number): any {
        let newValue = {};
        if (Array.isArray(value)) {
            if (value.length >= 4) {
                newValue = {'top': value[0], 'right': value[1], 'bottom': value[2], 'left': value[3]};
            } else if (value.length === 3) {
                newValue = {'top': value[0], 'right': value[1], 'bottom': value[2], 'left': value[1]};
            } else if (value.length === 2) {
                newValue = {'top': value[0], 'right': value[1], 'bottom': value[0], 'left': value[1]};
            } else if (value.length === 1) {
                value = value[0];
            } else {
                value = defaultValue;
            }
        } else if (typeof value === 'object') {
            if (value['vertical']) {
                value['top'] = value['vertical'];
                value['bottom'] = value['vertical'];
            } else if (value['horizontal']) {
                value['right'] = value['horizontal'];
                value['left'] = value['horizontal'];
            }
            
            for (let side of ['top', 'right', 'bottom', 'left']) {
                newValue[side] = value[side] || value[side] === 0 ? value[side] : defaultValue;
            }
        }
        
        if (typeof value === 'number') {
            newValue = {'top': value, 'right': value, 'bottom': value, 'left': value};
        }
        
        return newValue;
    }

    static styles(styles) {
        styles = Array.isArray(styles) ? styles : [styles];
        return assign(defaultStyles(), ...styles);
    }

    static applyStyles(styles) {
        let doc = table.doc;
        let styleModifiers = {
            fillColor: doc.setFillColor,
            textColor: doc.setTextColor,
            fontStyle: doc.setFontStyle,
            lineColor: doc.setDrawColor,
            lineWidth: doc.setLineWidth,
            font: doc.setFont,
            fontSize: doc.setFontSize
        };
        Object.keys(styleModifiers).forEach(function (name) {
            let style = styles[name];
            let modifier = styleModifiers[name];
            if (typeof style !== 'undefined') {
                if (Array.isArray(style)) {
                    modifier.apply(this, style);
                } else {
                    modifier(style);
                }
            }
        });
    } 
}