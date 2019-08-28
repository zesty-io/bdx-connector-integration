// Home Plan Model
// Content Model Name: home-model
// Content Model ZUID: 6-faff74-pnqf1f
// https://3dlpqt3n.manage.zesty.io/#!/content/6-6a2e70-k254c2
// BDX XML Map: Builders.Corporation.Builder.Subdivision.Plan

module.exports = {
    'plan_id': "_attributes.PlanID",
    'plan_type' : "_attributes.Type",
    'plan_name' : "PlanName._text",
    'plan_number' : "PlanNumber._text",
    'base_price': "BasePrice._text",
    'square_footage' : "BaseSqft._text",
    'bedrooms': "Bedrooms._text",
    'stories' : "Stories._text",
    'master_bedroom_location': "Bedrooms._attributes.MasterBedLocation",
    'baths': "Baths._text",
    'marketing_headline' : "MarketingHeadline._text",
    'description' : "Description._cdata",
    'half_baths': "HalfBaths._text",
    'living_area': "LivingArea._text",
    'living_area_type': "LivingArea._attributes.Type",
    'garage': "Garage._text",
    'dining_areas': "DiningAreas._text",
    'plan_amenity': "PlanAmenity._text",
    'plan_amenity_type': "PlanAmenity._attributes.Type",
    'basement': "Basement._text",
    'builder' : "zestyMemoryBuilderZUID", // not sure what this is? as Builder is a relational field. 
    'floor_plan_1_url' : "PlanImages.FloorPlanImage[0]._text",
    'floor_plan_2_url' : "PlanImages.FloorPlanImage[1]._text"
    // in zesty but not in bdx
    // living_area_1-5, living_area_type_, amenities, brochure, included_features, sort_order

}
