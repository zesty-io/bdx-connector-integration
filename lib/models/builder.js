// Builder
// Content Model Name: builder-model
// Content Model ZUID: 6-f4a0ad94fc-hm6v7x
// https://3dlpqt3n.manage.zesty.io/#!/content/6-f4a0ad94fc-hm6v7x
// BDX XML Map: Builders.Corporation.Builder

module.exports =  {
    'builder_id': "_attributes.BuilderID",
    'brand_name' : "BrandName._text",
    'builder_number' : "BuilderNumber._text",
    'plan_number' : "PlanNumber._text",
    'builder' : "", // builder ZUID set programatically by zesty
    'square_footage' : "BaseSqft._text",
    'related_corporation' : "", //
    'subdivision_price_low' : "Subdivision._attributes.PriceLow", //
    'subdivision_price_high' : "Subdivision._attributes.PriceHigh", //
    'subdivision_square_foot_low' : "Subdivision._attributes.SqftLow", //
    'subdivision_square_foot_high' : "Subdivision._attributes.SqftHigh", //
    'subdivision_id' : "Subdivision._attributes.SubdivisionID", //
    'community_style' : 'Subdivision.CommunityStyle._text',
    'sales_office_agent_1': 'Subdivision.SalesOffice.Agent[0]._text',
    'sales_office_agent_2': 'Subdivision.SalesOffice.Agent[1]._text',
    'sales_office_street_address': 'Subdivision.SalesOffice.Address.Street1._text',
    'sales_office_city': 'Subdivision.SalesOffice.Address.City._text',
    'sales_office_address_county' : 'Subdivision.SalesOffice.Address.City._text', 
    'sales_office_zip_code' : 'Subdivision.SalesOffice.Address.ZIP._text',
    'sales_office_country' : 'Subdivision.SalesOffice.Address.Country._text',
    'sales_office_latitude' :  'Subdivision.SalesOffice.Address.Geocode.Latitude._text',
    'sales_office_longitude' : 'Subdivision.SalesOffice.Address.Geocode.Longitude._text',
    'sales_office_tel_area_code': 'Subdivision.SalesOffice.Phone.AreaCode._text', 
    'sales_office_tel_prefix': 'Subdivision.SalesOffice.Phone.Prefix._text', 
    'sales_office_tel_suffix': 'Subdivision.SalesOffice.Phone.Suffix._text', 
    'sales_office_email': 'Subdivision.SalesOffice.Email._text', 
    'sales_office_hours': 'Subdivision.SalesOffice.Hours._text', 
    'subdivision_street_address': 'Subdivision.SubAddress.SubStreet1._text', 
    'subdivision_county': 'Subdivision.SubAddress.SubCounty._text', 
    'subdivision_city': 'Subdivision.SubAddress.SubCity._text', 
    'subdivision_state': 'Subdivision.SubAddress.SubState._text', 
    'subdivision_zip_code': 'Subdivision.SubAddress.SubZIP._text', 
    'subdivision_country': 'Subdivision.SubAddress.SubCountry._text', 
    'subdivision_latitude': 'Subdivision.SubAddress.SubGeocode.SubLatitude._text', 
    'subdivision_longitude': 'Subdivision.SubAddress.SubGeocode.SubLongitude._text', 
    'subdivision_amenity': 'Subdivision.SubAmenity._text', 
    'subdivision_amenity_type': 'Subdivision.SubAmenity._attributes.Type', 
    'subdivision_description': 'Subdivision.SubDescription._cdata', 
    'subdivision_website': 'Subdivision.SubWebsite._text', 
    // in the zesty content model but not in bdx
    // beds_low, beds_high, garages, bathroom_low, bathroom_high, half_bath, local_amenities_list, sort_order

}