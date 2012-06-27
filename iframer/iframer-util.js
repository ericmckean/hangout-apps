/**
 * Extracts the scheme, host and path of an Url.
 * @param {string} url The url to extract the parameters from.
 * @return {string} The root of the url.
 */
function getUrlRoot(url) {
  var startIndex =  url.indexOf('?') + 1;
  if (startIndex > 0) {
    return url.substring(0, startIndex - 1);
  }
  return url;
}


/**
 * Extracts url parameters of the containing window/iframe into an object.
 * @param {string} url The url to extract the parameters from.
 * @return {!Object} An object containing the paarameters as name/value pairs.
 */
function getUrlParams(url) {
  var result = {};
  var paramRegex = /([^&=]+)=?([^&]*)/g;
  var decode = function(value) {
    var addRegex = /\+/g;
    return decodeURIComponent(value.replace(addRegex, " "));
  };
  var startIndex =  url.indexOf('?') + 1;
  if (startIndex > 0) {
    var allParams = url.substring(url.indexOf('?') + 1);
    while (match = paramRegex.exec(allParams)) {
      result[decode(match[1])] = decode(match[2]);
    }
  }
  return result;
}

/**
 * Encodes an object as an url parameter string.
 * @param {!Object} params An object containing the parameters to encode.
 * @return {string} The encoded parameters. Includes leading '?'.
 */
function encodeUrlParams(params) {
  var result = '';
  for (var key in params) {
    result += (result.length === 0) ? '?' : '&';
    result += key + '=' + encodeURIComponent(params[key]);
  }
  return result;
}


/**
 * Writes a tag to the document.
 * @param {string} tag The tag to write.
 */
function writeTag(tag) {
  document.write(tag);
}


/**
 * Loads a javascript script by url.
 * @param {string} url The url of the string to load.
 */
function loadScript(url) {
  writeTag('<script type="text/javascript" src="' + url +
      '"><' + '/script>'); // Split script tag so it isn’t used as end of tag.
}
