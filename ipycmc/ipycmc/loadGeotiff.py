required_start_s3_link_lowercase = "s3://"
required_start_s3_link_uppercase = "S3://"
required_end_s3_link_lowercase = ".tif"
required_end_s3_link_uppercase = ".TIF"
defaults_tiler = {"tile_format": "png", "tile_scale":"1", "pixel_selection":"first", "TileMatrixSetId":"WebMercatorQuad", "resampling_method":"nearest", "return_mask":"true", "rescale":"0%2C1000"}


from . import widget


def loadGeotiffs(urls):
    print("in separate file and the passed argument is ")
    print(urls)
    
    # Check the type and format of the URLs passed into the function
    if check_valid_arguments(urls) == False:
        print("Returning empty string")
        return ""
    print("S3 link(s) are valid")
   
        
    # Execute the functions for a single GeoTIFF to wmts tiles and pass to CMC
    if isinstance(urls, str):
        return s3LinkForSingleGeoTIFFToWMTS(urls)

# Given a string representing a s3 link, checks that the link begins with s3:// and ends with .tiff. If this is not true, prints appropriate error messages
# and returns False
def checkValidS3Link(s3Link):
    # Checks the beginning type of the s3 link is s3://
    # Prints multiple errors if multiple errors exist within the given S3 link
    errors_found = True
    if s3Link[:len(required_start_s3_link_lowercase)] != required_start_s3_link_lowercase and s3Link[:len(required_start_s3_link_uppercase)] != required_start_s3_link_uppercase:
        print("Invalid s3 link: "+s3Link+". Beginning "+s3Link[:len(required_start_s3_link_lowercase)]+ " does not match "+required_start_s3_link_lowercase +" or "+required_start_s3_link_uppercase+ ".")
        errors_found = False
        
    # Checks that the ending type of the s3 link is .tiff
    if s3Link[len(required_end_s3_link_lowercase)*-1:] != required_end_s3_link_lowercase and s3Link[len(required_end_s3_link_uppercase)*-1:] != required_end_s3_link_uppercase:
        print("Invalid s3 link: "+s3Link+". Ending "+s3Link[len(required_end_s3_link_lowercase)*-1:]+ " does not match "+required_end_s3_link_lowercase +" or "+required_end_s3_link_uppercase+ ".")
        errors_found = False
        
    return errors_found

def createTilerRequestForSingleGeoTIFF(s3Url):
    newUrl = "https://baxpil3vd6.execute-api.us-east-1.amazonaws.com/cog/WMTSCapabilities.xml?"
    newUrl = newUrl + "url=" + s3Url
    defaultValues = ""
    for key in defaults_tiler:
        defaultValues = defaultValues + "&" + key + "=" +defaults_tiler[key]
    #defaultValues = "&tile_format=png&tile_scale=1&TileMatrixSetId=WebMercatorQuad&resampling_method=nearest&return_mask=true&rescale=0%2C1000"
    newUrl = newUrl + defaultValues
    return newUrl

def s3LinkForSingleGeoTIFFToWMTS(s3Url):
    url = createTilerRequestForSingleGeoTIFF(s3Url)
    print("new URL generated " + url)
    return url
    
# Returns False if arguments are invalid
def check_valid_arguments(urls):
    if isinstance(urls, str):
        return checkValidS3Link(urls)
    elif isinstance(urls, list):
        for url in urls:
            if checkValidS3Link(url) == False:
                return False
        return True
    else:
        print("The variable you passed for urls is " +str(type(urls)) + ". The only accepted types for this function are a string or list.")
        return False