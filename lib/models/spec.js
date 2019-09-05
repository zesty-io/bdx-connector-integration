// Label: Home Plan Model Spec Listing
// Content Model Name: home-model-listing
// Content Model ZUID: 6-6a2e70-k254c2
// https://3dlpqt3n.manage.zesty.io/#!/content/6-6a2e70-k254c2
// BDX XML Map: Builders.Corporation.Builder.Subdivision.Plan.Spec

module.exports =  {
    'spec_id': "_attributes.SpecID",
    'spec_type' : "_attributes.Type",
    'spec_number' : "SpecNumber._text",
    'home_model' : "", // sorced by zesty in the script
    'spec_street_address': "SpecAddress.SpecStreet1._text",
    'spec_city': "SpecAddress.SpecCity._text",
    'spec_state': "SpecAddress.SpecState._text",
    'spec_zip_code': "SpecAddress.SpecZIP._text",
    'spec_country': "SpecAddress.SpecCountry._text", // not used
    'spec_latitude': "SpecAddress.SpecGeocode.SpecLatitude._text", // not used
    'spec_longitude': "SpecAddress.SpecGeocode.SpecLongitude._text", // not used
    'spec_movein_date' : "SpecMoveInDate.Day._text",
    'spec_is_model' : "SpecIsModel._text", // not used
    'spec_price': "SpecPrice._text",
    'spec_square_footage' : "SpecSqft._text",
    'spec_number_of_stories' : "SpecStories._text",
    'spec_square_footage' : "SpecSqft._text",
    'spec_location' : "SpecLocation._text", // not used
    'spec_baths' : "SpecBaths._text",
    'spec_half_baths' : "SpecHalfBaths._text",
    'spec_bedrooms' : "SpecBedrooms._text",
    'spec_master_bedroom_location' : "SpecBedrooms._attributes.MasterBedLocation", // not used
    'spec_garage' : "SpecGarage._text",
    'spec_living_area' : "SpecLivingArea._text", // not used
    'spec_living_area_type' : "SpecLivingArea._attributes.Type", // not used, numbers 1-5 ignored
    'spec_marketing_headline' : "SpecMarketingHeadline._text",
    'spec_amenity' : "SpecAmenity._text", // not used
    'spec_amenity_type' : "SpecAmenity._attributes.Type", // not used
    'spec_description' : "SpecDescription._cdata",
    'spec_dining_areas' : "SpecDiningAreas._text", // not used
    'spec_basement' : "SpecBasement._text", // not used
    'spec_floorplan_url_1':  "SpecImages.SpecFloorPlanImage[0]._text",
    'spec_floorplan_url_2': "SpecImages.SpecFloorPlanImage[1]._text",
    // in zesty but not in bdx
    // spec_floorplan_image_1, spec_floorplan_image_2, spec_previous_price, google_maps_link, amenities, brochure, included_features, sort_order
}
