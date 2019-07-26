// cloning an object, taken from: 
// http://stackoverflow.com/questions/728360/most-elegant-way-to-clone-a-javascript-object
function clone(obj) {
    var copy;

    // Handle the 3 simple types, and null or undefined
    if (null == obj || "object" != typeof obj) return obj;

    // Handle Date
    if (obj instanceof Date) {
        copy = new Date();
        copy.setTime(obj.getTime());
        return copy;
    }

    // Handle Array
    if (obj instanceof Array) {
        return obj.slice(0);
    }

    // Handle Object
    if (obj instanceof Object) {
        copy = {};
        for (var attr in obj) {
            if (obj.hasOwnProperty(attr)) copy[attr] = clone(obj[attr]);
        }
        return copy;
    }

    throw new Error("Unable to copy obj! Its type isn't supported.");
}

var getDateTime = function() {
    // For todays date;
    Date.prototype.today = function () { 
        return ((this.getDate() < 10)?"0":"") + this.getDate() +"/"+(((this.getMonth()+1) < 10)?"0":"") + (this.getMonth()+1) +"/"+ this.getFullYear();
    }

    // For the time now
    Date.prototype.timeNow = function () {
         return ((this.getHours() < 10)?"0":"") + this.getHours() +":"+ ((this.getMinutes() < 10)?"0":"") + this.getMinutes() +":"+ ((this.getSeconds() < 10)?"0":"") + this.getSeconds();
    }

    var datetime = new Date().today() + "," + new Date().timeNow();
    return datetime
};

var rep = function(symbol, noTimes) {
    var index = [];
    for (var j = 0; j < noTimes; j++) index.push(symbol);
    return index
};

// small function for selecting elements in an array according to an index array
var subarray = function(vector, index) {
    var result = [];
    for (var i = 0; i < index.length; i++) {
        var idx = index[i]
        result.push(vector[idx]);
    }
    return(result)
}



// R like function for computing a cross product of two vectors, vectors can be numbers or booleans
var crossProd = function(vec1, vec2) {
    // basic assertions
    if(vec1.constructor !== Array || vec2.constructor !== Array) {
        throw new Error("One of the vectors are not arrays as required")
    }
    if(vec1.length !== vec2.length) {
        throw new Error("Arrays not of equal length")
    }
    // we multiply
    var result = [];
    for (var j = 0; j < vec1.length; j++) {
        result.push(vec1[j]*vec2[j]);
    }
    // finally we sum the array elements and return a scalar
    return(sum(result))
};

// R like function for creating an array of numbers
var seq = function(start, end, by, lengthOut) {
    var lengthOut = (typeof lengthOut === 'undefined') ? 'undefined' : lengthOut;
    var by = (typeof by === 'undefined') ? 1 : by;

    if (lengthOut === 'undefined') {
       
        if (start<end) {
            
            var index = [];
            for (var j = start; j < end; j=j+by) index.push(j)
            return index
        } else if (start>end) {
            by = -by;
            var index = [];
            for (var j = start; j > end; j=j+by) index.push(j)
            return index
        } else return; 

    } else {
        if(lengthOut>1) var by = (end-start)/(lengthOut-1);
        else return;
        if (start<end) {
            var index = [];
            for (var j = start; j < end; j=j+by) index.push(j)
            return index
        } else if (start>end) {
            var index = [];
            for (var j = start; j > end; j=j+by) index.push(j)
            return index
        } else return; 
    }
};




// we need a function to reshuffle objects given some random order vector, this function is based on the one in jsPsych library, but that one doesn't have order argument which allows us to order some arbitrary array according to prespecified order, and not randomly. It also produces an index together with a shuffled array, so that we can record exactly the information on randomization.
var shuffle = function(array, order) {

    var order = (typeof order === 'undefined') ? [] : order
    var m = array.length, t, i;
    var index = [];
    for (var j = 0; j < array.length; ++j) index.push(j)
    //var copy = jquery.extend( {}, array );
    var copy = array.slice(0);
    // While there remain elements to shuffle…
    while (m) {
        // Pick a remaining element…
        i = Math.floor(Math.random() * m--);
        if(order.length===0) {
            
            // And swap it with the current element.
            t = array[m];
            array[m] = array[i];
            array[i] = t;
            
            id = index[m]
            index[m] = index[i]
            index[i] = id;
        } else {
            array[order[m]] = copy[m];
            
            id = index[m]
            index[m] = index[order[m]]
            index[order[m]] = id;
        }
        
    }
    return {array: array, index: index};
};

// To create data with draws from Normal distribution 
var rnorm = function(mean, variance) { 

    // Defined in "A First Course of Probability" by Sheldon Ross (pp. 464, 6ed):
    if (mean === undefined) mean = 0.0; 
    if (variance === undefined) variance = 1.0; 
    var V1, V2, S; 
    do { 
        V1 = 2 * Math.random() - 1; 
        V2 = 2 * Math.random() - 1; 
        S = V1 * V1 + V2 * V2; 
    } while (S > 1); 
    X = Math.sqrt(-2 * Math.log(S) / S) * V1; 
    //Y = Math.sqrt(-2 * Math.log(S) / S) * V2; 
    X = mean + Math.sqrt(variance) * X; 
    //Y = mean + Math.sqrt(variance) * Y; 
    return X; 
};

// To create data with draws from Bernoulli distribution 
var rbinom = function(n,p) { 

    if (p === undefined) p = 0.5;
    if (n === undefined) n = 1;
    
    if(n===1) { return (Math.random() < p) ? 1 : 0; }
    else {
        var noDraws = 0;
        for(var i=0; i < n; i++) { 
            if (Math.random()>p) { noDraws = noDraws + 1; }
        }
        return( noDraws ) 
    }
};

// Simpel wrapper for creating an array of draws from uniform distribution
var runif = function(noDraws, min, max) {
    var draws = []; 
    for(var i=0; i < noDraws; i++) {
        draws.push(Math.random()* (max - min) + min)
    }
    return(draws)
    }

// we need rescaling function, to be able to represent any feature value in the squares
var rescale = function(value, min, max, targetmin, targetmax) {
    
    // sensible deafults for target range
    var targetmin = (typeof targetmin === 'undefined') ? 0 : targetmin;
    var targetmax = (typeof targetmax === 'undefined') ? 1 : targetmax;

    // rescaling
    var rescaledValue = - (-max*targetmin + min*targetmax - (-targetmin+targetmax)*value) / (max - min)

    return(rescaledValue)
}
