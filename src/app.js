import {
  hexToRgb,
  rlEncode,
  rlDecode,
  rlDecodeSigned,
  blendMultiply,
  blendOverlay,
  blendSoftLight,
} from "./utils.js";

const PRESETS = [
  { name: "Peppercorn SW 7674", hex: "#585858" },
  { name: "Unique Gray SW 6260", hex: "#CBC9C9" },
  { name: "Fashionable Gray SW 6275", hex: "#BDB8B8" },
  { name: "Ponder SW 7079", hex: "#BCB6B6" },
  { name: "Quest Gray SW 7080", hex: "#ADA5A5" },
  { name: "Imagine SW 6009", hex: "#C2B6B6" },
  { name: "Socialite SW 6025", hex: "#907676" },
  { name: "Bitter Chocolate SW 6013", hex: "#4D3C3C" },
  { name: "Carnelian SW 7580", hex: "#573E3E" },
  { name: "Salon Rose SW 0061", hex: "#AB7878" },
  { name: "Pressed Flower SW 6304", hex: "#C39393" },
  { name: "Rookwood Dark Red SW 2801", hex: "#4B2929" },
  { name: "Sun Dried Tomato SW 7585", hex: "#692B2B" },
  { name: "Lotus Flower SW 6310", hex: "#E6BDBD" },
  { name: "Dishy Coral SW 6598", hex: "#ED9190" },
  { name: "Hopeful SW 6597", hex: "#F0B3B2" },
  { name: "Antique Red SW 7587", hex: "#9F4442" },
  { name: "Rose Colored SW 6303", hex: "#DCB6B5" },
  { name: "Sommelier SW 7595", hex: "#5D3736" },
  { name: "Appleblossom SW 0076", hex: "#DAB5B4" },
  { name: "Stop SW 6869", hex: "#C33A36" },
  { name: "Rosaline Pearl SW 9077", hex: "#A38887" },
  { name: "Tanager SW 6601", hex: "#A43834" },
  { name: "Red Tomato SW 6607", hex: "#B24743" },
  { name: "Charming Pink SW 6309", hex: "#EDD3D2" },
  { name: "Rookwood Red SW 2802", hex: "#622F2D" },
  { name: "Reddish SW 6319", hex: "#B56966" },
  { name: "Salute SW 7582", hex: "#803532" },
  { name: "Bella Pink SW 6596", hex: "#F1C6C4" },
  { name: "Bravado Red SW 6320", hex: "#A0524E" },
  { name: "Bolero SW 7600", hex: "#903934" },
  { name: "Crabby Apple SW 7592", hex: "#753531" },
  { name: "Rave Red SW 6608", hex: "#A13B34" },
  { name: "Coral Rose SW 9004", hex: "#C37F7A" },
  { name: "Auger Shell SW 9159", hex: "#9F9291" },
  { name: "Studio Mauve SW 0062", hex: "#C6B9B8" },
  { name: "Innocence SW 6302", hex: "#EBD1CF" },
  { name: "Resounding Rose SW 6318", hex: "#CD8E89" },
  { name: "Dark Auburn SW 6034", hex: "#5A3532" },
  { name: "Vaguely Mauve SW 6015", hex: "#D1C5C4" },
  { name: "Rembrandt Ruby SW 0033", hex: "#974F49" },
  { name: "Habanero Chile SW 7589", hex: "#B8473D" },
  { name: "Toile Red SW 0006", hex: "#8B534E" },
  { name: "Carriage Door SW 7594", hex: "#6E423E" },
  { name: "Coral Reef SW 6606", hex: "#D9766C" },
  { name: "Fireweed SW 6328", hex: "#7B3730" },
  { name: "Rosy Outlook SW 6316", hex: "#EBCECB" },
  { name: "Youthful Coral SW 6604", hex: "#F0AFA8" },
  { name: "Dressy Rose SW 6024", hex: "#B89D9A" },
  { name: "Chinese Red SW 0057", hex: "#9E3E33" },
  { name: "Charisma SW 6605", hex: "#EE9489" },
  { name: "Bold Brick SW 6327", hex: "#A0584F" },
  { name: "Quite Coral SW 6614", hex: "#C76356" },
  { name: "Henna Shade SW 6326", hex: "#B3675D" },
  { name: "Gracious Rose SW 6317", hex: "#E3B7B1" },
  { name: "Flexible Gray SW 6010", hex: "#B1A3A1" },
  { name: "Renwick Heather SW 2818", hex: "#8B7D7B" },
  { name: "Rosedust SW 0025", hex: "#CC8D84" },
  { name: "Rustic Red SW 7593", hex: "#703229" },
  { name: "Red Barn SW 7591", hex: "#7C453D" },
  { name: "Foxy SW 6333", hex: "#A85E53" },
  { name: "Browse Brown SW 6012", hex: "#6E615F" },
  { name: "Rockweed SW 2735", hex: "#443735" },
  { name: "Coral Clay SW 9005", hex: "#BF796E" },
  { name: "Flower Pot SW 6334", hex: "#8F4438" },
  { name: "Peppery SW 6615", hex: "#B85444" },
  { name: "Destiny SW 6274", hex: "#CFC9C8" },
  { name: "Minute Mauve SW 7078", hex: "#CFC9C8" },
  { name: "Polished Mahogany SW 2838", hex: "#432722" },
  { name: "Lei Flower SW 6613", hex: "#D87B6A" },
  { name: "Oleander SW 6603", hex: "#F2CCC5" },
  { name: "Bateau Brown SW 6033", hex: "#7A5F5A" },
  { name: "Fired Brick SW 6335", hex: "#83382A" },
  { name: "Fiery Brown SW 6055", hex: "#5D3831" },
  { name: "Breathless SW 6022", hex: "#D6C2BE" },
  { name: "Queen Anne Lilac SW 0021", hex: "#C0B6B4" },
  { name: "Insightful Rose SW 6023", hex: "#C9B0AB" },
  { name: "Brick Paver SW 7599", hex: "#93402F" },
  { name: "Cayenne SW 6881", hex: "#C04D35" },
  { name: "Dutch Cocoa SW 6032", hex: "#8C706A" },
  { name: "Chinchilla SW 6011", hex: "#867875" },
  { name: "Rojo Dust SW 9006", hex: "#B57466" },
  { name: "Hearty Orange SW 6622", hex: "#B44B34" },
  { name: "Roycroft Copper Red SW 2839", hex: "#7B3728" },
  { name: "Canyon Clay SW 6054", hex: "#85594F" },
  { name: "Rejuvenate SW 6620", hex: "#DD7861" },
  { name: "Black Bean SW 6006", hex: "#403330" },
  { name: "Emotional SW 6621", hex: "#C65F47" },
  { name: "Rachel Pink SW 0026", hex: "#E8B9AE" },
  { name: "Constant Coral SW 6325", hex: "#CD8E7F" },
  { name: "Reddened Earth SW 6053", hex: "#9C6E63" },
  { name: "Jalapeño SW 6629", hex: "#B1533C" },
  { name: "Roycroft Adobe SW 0040", hex: "#A76251" },
  { name: "Aurora Brown SW 2837", hex: "#6A4238" },
  { name: "Cocoa Berry SW 9078", hex: "#A08882" },
  { name: "Cajun Red SW 0008", hex: "#8D422F" },
  { name: "Ravishing Coral SW 6612", hex: "#E79580" },
  { name: "Rojo Marrón SW 9182", hex: "#4B3029" },
  { name: "Comical Coral SW 6876", hex: "#F3D1C8" },
  { name: "Sierra Redwood SW 7598", hex: "#924E3C" },
  { name: "Glamour SW 6031", hex: "#B6A09A" },
  { name: "Artistic Taupe SW 6030", hex: "#C3B1AC" },
  { name: "Jazz Age Coral SW 0058", hex: "#F1BFB1" },
  { name: "Spicy Hue SW 6342", hex: "#994B35" },
  { name: "Mellow Coral SW 6324", hex: "#E3B5A8" },
  { name: "Coral Island SW 6332", hex: "#CE9382" },
  { name: "Jovial SW 6611", hex: "#F2B8A7" },
  { name: "Sockeye SW 6619", hex: "#E49780" },
  { name: "Roycroft Rose SW 0034", hex: "#C08F80" },
  { name: "Hushed Auburn SW 9080", hex: "#A8857A" },
  { name: "Terra Brun SW 6048", hex: "#5A382D" },
  { name: "Obstinate Orange SW 6884", hex: "#D7552A" },
  { name: "Smart White SW 6007", hex: "#E4DBD8" },
  { name: "Mulberry Silk SW 0001", hex: "#94766C" },
  { name: "Raucous Orange SW 6883", hex: "#C35530" },
  { name: "Smoky Salmon SW 6331", hex: "#E2B6A7" },
  { name: "Vintage Leather SW 6062", hex: "#694336" },
  { name: "Red Cent SW 6341", hex: "#AD654C" },
  { name: "Hot Cocoa SW 6047", hex: "#806257" },
  { name: "Cabbage Rose SW 0003", hex: "#C59F91" },
  { name: "Cavern Clay SW 7701", hex: "#AC6B53" },
  { name: "Pink Shadow SW 0070", hex: "#DEC3B9" },
  { name: "Velvety Chestnut SW 9079", hex: "#A2877D" },
  { name: "Folkstone SW 6005", hex: "#6D6562" },
  { name: "Robust Orange SW 6628", hex: "#C4633E" },
  { name: "Baked Clay SW 6340", hex: "#C1785C" },
  { name: "Swing Brown SW 6046", hex: "#947569" },
  { name: "Husky Orange SW 6636", hex: "#BB613E" },
  { name: "Caribbean Coral SW 2854", hex: "#BE795E" },
  { name: "Dreamy White SW 6021", hex: "#E3D9D5" },
  { name: "White Truffle SW 6029", hex: "#D7C8C2" },
  { name: "Pennywise SW 6349", hex: "#A2583A" },
  { name: "Quaint Peche SW 6330", hex: "#EACDC1" },
  { name: "Sandbank SW 6052", hex: "#C3A497" },
  { name: "Otter SW 6041", hex: "#56433B" },
  { name: "Reynard SW 6348", hex: "#B46848" },
  { name: "Emberglow SW 6627", hex: "#D67C56" },
  { name: "Koral Kicks SW 6610", hex: "#F2D1C3" },
  { name: "Poised Taupe SW 6039", hex: "#8C7E78" },
  { name: "Nutshell SW 6040", hex: "#756761" },
  { name: "Romance SW 6323", hex: "#EBCFC3" },
  { name: "Individual White SW 6008", hex: "#D4CDCA" },
  { name: "Knockout Orange SW 6885", hex: "#E16F3E" },
  { name: "Persimmon SW 6339", hex: "#D9987C" },
  { name: "Moroccan Spice SW 6060", hex: "#9D7868" },
  { name: "Subdued Sienna SW 9009", hex: "#CC896C" },
  { name: "Chateau Brown SW 7510", hex: "#5B4B44" },
  { name: "Chrysanthemum SW 6347", hex: "#C47B5B" },
  { name: "Cosmetic Peach SW 6618", hex: "#F3C1AB" },
  { name: "Mink SW 6004", hex: "#847B77" },
  { name: "Fairfax Brown SW 2856", hex: "#61463A" },
  { name: "Sashay Sand SW 6051", hex: "#CFB4A8" },
  { name: "Turkish Coffee SW 6076", hex: "#4D3930" },
  { name: "Blushing SW 6617", hex: "#F0D1C3" },
  { name: "Tanbark SW 6061", hex: "#896656" },
  { name: "Rose Tan SW 0069", hex: "#CD9C85" },
  { name: "Determined Orange SW 6635", hex: "#C56639" },
  { name: "Sunset SW 6626", hex: "#E2946F" },
  { name: "Emerging Taupe SW 6045", hex: "#B8A196" },
  { name: "Copper Wire SW 7707", hex: "#C67B57" },
  { name: "Brevity Brown SW 6068", hex: "#715243" },
  { name: "Essential Gray SW 6002", hex: "#BCB8B6" },
  { name: "Quartersawn Oak SW 2836", hex: "#85695B" },
  { name: "Armadillo SW 9160", hex: "#9E9089" },
  { name: "Truly Taupe SW 6038", hex: "#AC9E97" },
  { name: "Temperate Taupe SW 6037", hex: "#BFB1AA" },
  { name: "Redend Point SW 9081", hex: "#AE8E7E" },
  { name: "Abalone Shell SW 6050", hex: "#DBC7BD" },
  { name: "Spiced Cider SW 7702", hex: "#B0785C" },
  { name: "Earthen Jug SW 7703", hex: "#A85E39" },
  { name: "Copper Harbor SW 6634", hex: "#D57E52" },
  { name: "Decorous Amber SW 0007", hex: "#AC7559" },
  { name: "Certain Peach SW 6625", hex: "#F2BDA2" },
  { name: "Invigorate SW 6886", hex: "#E47237" },
  { name: "French Roast SW 6069", hex: "#4F3426" },
  { name: "Fame Orange SW 6346", hex: "#DB9C7B" },
  { name: "Doeskin SW 6044", hex: "#C6B3A9" },
  { name: "Warming Peach SW 6338", hex: "#E4B9A2" },
  { name: "Copper Mountain SW 6356", hex: "#A6613C" },
  { name: "Garret Gray SW 6075", hex: "#756861" },
  { name: "Peach Blossom SW 6624", hex: "#F3D0BD" },
  { name: "Hush White SW 6042", hex: "#E5DAD4" },
  { name: "Wheat Penny SW 7705", hex: "#976B53" },
  { name: "Plantation Shutters SW 7520", hex: "#6A5143" },
  { name: "Faint Coral SW 6329", hex: "#EEDED5" },
  { name: "Interface Tan SW 6059", hex: "#C1A392" },
  { name: "Unfussy Beige SW 6043", hex: "#D6C8C0" },
  { name: "Mocha SW 6067", hex: "#967A6A" },
  { name: "Polished Concrete SW 9167", hex: "#9E9793" },
  { name: "Mellow Mauve SW 0039", hex: "#C4957A" },
  { name: "Likeable Sand SW 6058", hex: "#D1B7A8" },
  { name: "Pinky Beige SW 0079", hex: "#C9AA98" },
  { name: "Truepenny SW 6355", hex: "#B46C42" },
  { name: "Yam SW 6643", hex: "#C36F3E" },
  { name: "Angora SW 6036", hex: "#D1C5BE" },
  { name: "Renwick Rose Beige SW 2804", hex: "#AF8871" },
  { name: "Brandywine SW 7710", hex: "#A56C4A" },
  { name: "Armagnac SW 6354", hex: "#C38058" },
  { name: "Proper Gray SW 6003", hex: "#ADA8A5" },
  { name: "Grayish SW 6001", hex: "#CFCAC7" },
  { name: "Java SW 6090", hex: "#634533" },
  { name: "Intimate White SW 6322", hex: "#F0E1D8" },
  { name: "Sable SW 6083", hex: "#5F4B3F" },
  { name: "Neighborly Peach SW 6632", hex: "#F3C1A3" },
  { name: "Rookwood Medium Brown SW 2807", hex: "#6E5241" },
  { name: "Inventive Orange SW 6633", hex: "#E89D6F" },
  { name: "Naive Peach SW 6631", hex: "#F3D3BF" },
  { name: "Dusted Truffle SW 9083", hex: "#9C8373" },
  { name: "Chivalry Copper SW 6353", hex: "#D4966E" },
  { name: "Malted Milk SW 6057", hex: "#DECABD" },
  { name: "Windswept Canyon SW 9010", hex: "#DBA480" },
  { name: "Rhumba Orange SW 6642", hex: "#CB7841" },
  { name: "Manor House SW 7505", hex: "#665D57" },
  { name: "Gorgeous White SW 6049", hex: "#E7DBD3" },
  { name: "Spun Sugar SW 6337", hex: "#EDD2C0" },
  { name: "Outgoing Orange SW 6641", hex: "#E6955F" },
  { name: "Pottery Urn SW 7715", hex: "#AA866E" },
  { name: "Cultured Pearl SW 6028", hex: "#E5DCD6" },
  { name: "Umber Rust SW 9100", hex: "#765138" },
  { name: "Gingery SW 6363", hex: "#B06C3E" },
  { name: "Nuthatch SW 6088", hex: "#8E725F" },
  { name: "Chocolate Powder SW 9082", hex: "#A58C7B" },
  { name: "Cobble Brown SW 6082", hex: "#7A6455" },
  { name: "Sumptuous Peach SW 6345", hex: "#E5B99B" },
  { name: "Grounded SW 6089", hex: "#785B47" },
  { name: "Peach Fuzz SW 6344", hex: "#ECCFBB" },
  { name: "Tigereye SW 6362", hex: "#BB7748" },
  { name: "Classic Sand SW 0056", hex: "#D6BCAA" },
  { name: "Aristocrat Peach SW 0027", hex: "#ECCEB9" },
  { name: "Spalding Gray SW 6074", hex: "#8D7F75" },
  { name: "Copper Pot SW 7709", hex: "#B16A37" },
  { name: "Chelsea Mauve SW 0002", hex: "#BEAC9F" },
  { name: "Autumnal SW 6361", hex: "#CD8C5D" },
  { name: "Trusty Tan SW 6087", hex: "#B59F8F" },
  { name: "Sand Trap SW 6066", hex: "#BBA595" },
  { name: "Soft Apricot SW 6352", hex: "#E0B392" },
  { name: "Tree Branch SW 7525", hex: "#8A7362" },
  { name: "Antiquarian Brown SW 0045", hex: "#946644" },
  { name: "Oak Creek SW 7718", hex: "#BB8D6B" },
  { name: "Toasty SW 6095", hex: "#957258" },
  { name: "Tangerine SW 6640", hex: "#F2AC78" },
  { name: "Half-Caff SW 9091", hex: "#604C3D" },
  { name: "Sand Dune SW 6086", hex: "#C5B1A2" },
  { name: "Palisade SW 7635", hex: "#AA9E95" },
  { name: "Polite White SW 6056", hex: "#E9DDD4" },
  { name: "Original White SW 7077", hex: "#E2DEDB" },
  { name: "Melón Meloso SW 9007", hex: "#F2B88C" },
  { name: "Caraïbe SW 9090", hex: "#785F4C" },
  { name: "Nearly Peach SW 6336", hex: "#EFDED1" },
  { name: "Rookwood Brown SW 2806", hex: "#7F614A" },
  { name: "Iced Mocha SW 9092", hex: "#A3846C" },
  { name: "Bona Fide Beige SW 6065", hex: "#CBB9AB" },
  { name: "Burnished Brandy SW 7523", hex: "#7C5C43" },
  { name: "Chatura Gray SW 9169", hex: "#A09287" },
  { name: "Sensational Sand SW 6094", hex: "#BFA38D" },
  { name: "Folksy Gold SW 6360", hex: "#D69969" },
  { name: "Down Home SW 6081", hex: "#907865" },
  { name: "Homestead Brown SW 7515", hex: "#6E5F53" },
  { name: "Llama Wool SW 9089", hex: "#917864" },
  { name: "Dark Clove SW 9183", hex: "#4C3D31" },
  { name: "Dry Dock SW 7502", hex: "#A18D7D" },
  { name: "Serape SW 6656", hex: "#D88B4D" },
  { name: "Jute Brown SW 6096", hex: "#815D40" },
  { name: "Sweet Orange SW 6351", hex: "#EBCCB3" },
  { name: "Navel SW 6887", hex: "#EC8430" },
  { name: "Tower Tan SW 7704", hex: "#D5B59B" },
  { name: "Smokey Topaz SW 6117", hex: "#A57955" },
  { name: "Hickory Smoke SW 7027", hex: "#564537" },
  { name: "Cool Beige SW 9086", hex: "#C6B5A7" },
  { name: "Amber Wave SW 6657", hex: "#D28240" },
  { name: "Familiar Beige SW 6093", hex: "#CAB3A0" },
  { name: "Beige SW 2859", hex: "#DFC8B5" },
  { name: "Townhouse Tan SW 7712", hex: "#DFC8B5" },
  { name: "Sociable SW 6359", hex: "#E8BE9B" },
  { name: "Reticence SW 6064", hex: "#D9CDC3" },
  { name: "Saddle Up SW 9099", hex: "#725237" },
  { name: "Hammered Silver SW 2840", hex: "#978A7F" },
  { name: "Avid Apricot SW 6639", hex: "#F4C69F" },
  { name: "Sturdy Brown SW 6097", hex: "#69482C" },
  { name: "Baked Cookie SW 9098", hex: "#89674A" },
  { name: "Black Fox SW 7020", hex: "#4F4842" },
  { name: "Sun Bleached Ochre SW 9011", hex: "#E3AB7B" },
  { name: "Wickerwork SW 0010", hex: "#C19E80" },
  { name: "Leather Bound SW 6118", hex: "#8D623D" },
  { name: "Yearling SW 7725", hex: "#AD896A" },
  { name: "Pueblo SW 7711", hex: "#E6D0BD" },
  { name: "Saucy Gold SW 6370", hex: "#B6743B" },
  { name: "Eastlake Gold SW 0009", hex: "#C28E61" },
  { name: "Tatami Tan SW 6116", hex: "#BA8C64" },
  { name: "Gauzy White SW 6035", hex: "#E3DBD4" },
  { name: "Utterly Beige SW 6080", hex: "#B5A597" },
  { name: "Van Dyke Brown SW 7041", hex: "#564536" },
  { name: "Deer Valley SW 7720", hex: "#C7A485" },
  { name: "Threshold Taupe SW 7501", hex: "#AC9A8A" },
  { name: "Cocoa Whip SW 9084", hex: "#A08E7E" },
  { name: "Nice White SW 6063", hex: "#E6DDD5" },
  { name: "Lightweight Beige SW 6092", hex: "#DAC8B8" },
  { name: "Tiki Hut SW 7509", hex: "#826F5E" },
  { name: "Creamery SW 6358", hex: "#EDD0B6" },
  { name: "Adventure Orange SW 6655", hex: "#E69F5F" },
  { name: "Kaffee SW 6104", hex: "#65503D" },
  { name: "Utaupeia SW 9088", hex: "#A58F7B" },
  { name: "Über Umber SW 9107", hex: "#7B5838" },
  { name: "Backdrop SW 7025", hex: "#867A6F" },
  { name: "Mexican Sand SW 7519", hex: "#AF9781" },
  { name: "Craft Paper SW 6125", hex: "#8A6645" },
  { name: "Tea Chest SW 6103", hex: "#7D644D" },
  { name: "Totally Tan SW 6115", hex: "#CCA683" },
  { name: "Portabello SW 6102", hex: "#947A62" },
  { name: "Umber SW 6146", hex: "#6E543C" },
  { name: "Nearly Brown SW 9093", hex: "#A88E76" },
  { name: "Ginger Root SW 9095", hex: "#D2B79E" },
  { name: "Craftsman Brown SW 2835", hex: "#AE9278" },
  { name: "Sticks & Stones SW 7503", hex: "#A49689" },
  { name: "Touch of Sand SW 9085", hex: "#D5C7BA" },
  { name: "Caramelized SW 9186", hex: "#C29871" },
  { name: "Rookwood Clay SW 2823", hex: "#9A7E64" },
  { name: "Diverse Beige SW 6079", hex: "#C2B4A7" },
  { name: "Carnival SW 6892", hex: "#EB882C" },
  { name: "Meadowlark SW 7522", hex: "#9F8267" },
  { name: "Oak Barrel SW 7714", hex: "#BFA287" },
  { name: "Beige Intenso SW 9096", hex: "#C5A88D" },
  { name: "Rookwood Amber SW 2817", hex: "#C08650" },
  { name: "Simplify Beige SW 6085", hex: "#D6C7B9" },
  { name: "Canoe SW 7724", hex: "#B7987B" },
  { name: "Sycamore Tan SW 2855", hex: "#9C8A79" },
  { name: "Tavern Taupe SW 7508", hex: "#9C8A79" },
  { name: "Almond Roca SW 9105", hex: "#A78361" },
  { name: "Smoky Beige SW 9087", hex: "#B9A796" },
  { name: "Harvest Gold SW 2858", hex: "#D9A06A" },
  { name: "Playa Arenosa SW 9094", hex: "#DCC7B3" },
  { name: "Practical Beige SW 6100", hex: "#C9B29C" },
  { name: "Beach House SW 7518", hex: "#C9B29C" },
  { name: "Sands of Time SW 6101", hex: "#BCA38B" },
  { name: "Coconut Husk SW 6111", hex: "#70573F" },
  { name: "Dormer Brown SW 7521", hex: "#AD947C" },
  { name: "Tawny Tan SW 7713", hex: "#CCB299" },
  { name: "Bakelite Gold SW 6368", hex: "#D7995D" },
  { name: "Steady Brown SW 6110", hex: "#8A6B4D" },
  { name: "Flattering Peach SW 6638", hex: "#F4D3B3" },
  { name: "Marigold SW 6664", hex: "#D28233" },
  { name: "Gray Shingle SW 7670", hex: "#949392" },
  { name: "Perfect Greige SW 6073", hex: "#B7AB9F" },
  { name: "Only Natural SW 7596", hex: "#E2D3C4" },
  { name: "Lanyard SW 7680", hex: "#C09972" },
  { name: "Tassel SW 6369", hex: "#C6884A" },
  { name: "Gauntlet Gray SW 7019", hex: "#78736E" },
  { name: "Griffin SW 7026", hex: "#6F6459" },
  { name: "Foothills SW 7514", hex: "#827466" },
  { name: "Realist Beige SW 6078", hex: "#D3C8BD" },
  { name: "Everyday White SW 6077", hex: "#E4DCD4" },
  { name: "Renwick Beige SW 2805", hex: "#C3B09D" },
  { name: "Modest White SW 6084", hex: "#E6DDD4" },
  { name: "El Caramelo SW 9106", hex: "#946E48" },
  { name: "Gold Vessel SW 7677", hex: "#EABA8A" },
  { name: "Virtual Taupe SW 7039", hex: "#8A7A6A" },
  { name: "Double Latte SW 9108", hex: "#A78C71" },
  { name: "Colonial Revival Tan SW 2828", hex: "#D3B699" },
  { name: "Bagel SW 6114", hex: "#D7B593" },
  { name: "Sand Dollar SW 6099", hex: "#D7C5B3" },
  { name: "Sealskin SW 7675", hex: "#48423C" },
  { name: "Versatile Gray SW 6072", hex: "#C1B6AB" },
  { name: "Ibis White SW 7000", hex: "#F2ECE6" },
  { name: "Spatial White SW 6259", hex: "#DDDCDB" },
  { name: "Surprise Amber SW 6654", hex: "#EFB57A" },
  { name: "Ligonier Tan SW 7717", hex: "#D2B18F" },
  { name: "Soft Fawn SW 9097", hex: "#B59778" },
  { name: "Hopsack SW 6109", hex: "#9E8163" },
  { name: "Saffron Thread SW 6663", hex: "#DF984E" },
  { name: "New Colonial Yellow SW 2853", hex: "#D9AD7F" },
  { name: "Golden Gate SW 7679", hex: "#D9AD7F" },
  { name: "Honeycomb SW 6375", hex: "#D59858" },
  { name: "Viva Gold SW 6367", hex: "#E3AC72" },
  { name: "Renwick Golden Oak SW 2824", hex: "#96724C" },
  { name: "Sanderling SW 7513", hex: "#A79582" },
  { name: "Cardboard SW 6124", hex: "#9C7A56" },
  { name: "Moth Wing SW 9174", hex: "#A0907F" },
  { name: "Fragile Beauty SW 7553", hex: "#E7D7C6" },
  { name: "Farro SW 9103", hex: "#C1A485" },
  { name: "Bungalow Beige SW 7511", hex: "#CDBFB0" },
  { name: "Alluring White SW 6343", hex: "#EFE1D2" },
  { name: "Smokehouse SW 7040", hex: "#716354" },
  { name: "Mudslide SW 9113", hex: "#A08568" },
  { name: "Tamarind SW 7538", hex: "#C0A588" },
  { name: "Osage Orange SW 6890", hex: "#F4A045" },
  { name: "Song Thrush SW 9112", hex: "#AF987F" },
  { name: "Cowboy Boots SW 9115", hex: "#695239" },
  { name: "Fresco Cream SW 7719", hex: "#D8C4AE" },
  { name: "Reliable White SW 6091", hex: "#E8DED3" },
  { name: "Caen Stone SW 0028", hex: "#ECD0B1" },
  { name: "Elephant Ear SW 9168", hex: "#988F85" },
  { name: "Twilight Gray SW 0054", hex: "#C8BFB5" },
  { name: "Interactive Cream SW 6113", hex: "#E4CAAD" },
  { name: "Latte SW 6108", hex: "#BAA185" },
  { name: "Mesa Tan SW 7695", hex: "#BD9C77" },
  { name: "Functional Gray SW 7024", hex: "#ABA39A" },
  { name: "Dhurrie Beige SW 7524", hex: "#CABAA8" },
  { name: "Summer Day SW 6662", hex: "#EAAA62" },
  { name: "Popular Gray SW 6071", hex: "#D4CCC3" },
  { name: "Bittersweet Stem SW 7536", hex: "#CBB49A" },
  { name: "Status Bronze SW 7034", hex: "#5C4D3C" },
  { name: "Choice Cream SW 6357", hex: "#F0E1D0" },
  { name: "Thatch Brown SW 6145", hex: "#867057" },
  { name: "Nomadic Desert SW 6107", hex: "#C7B198" },
  { name: "Butterscotch SW 6377", hex: "#B67D3C" },
  { name: "Alpaca SW 7022", hex: "#CCC5BD" },
  { name: "Balanced Beige SW 7037", hex: "#C0B2A2" },
  { name: "Crescent Cream SW 7721", hex: "#EDD1B1" },
  { name: "Pediment SW 7634", hex: "#D3CCC4" },
  { name: "Papaya SW 6661", hex: "#EFB97B" },
  { name: "Warm Beige SW 0035", hex: "#EEDAC3" },
  { name: "Weathered Shingle SW 2841", hex: "#937F68" },
  { name: "Warm Stone SW 7032", hex: "#887B6C" },
  { name: "Library Pewter SW 0038", hex: "#7F7263" },
  { name: "Quinoa SW 9102", hex: "#CFB597" },
  { name: "Delicious Melon SW 6653", hex: "#F5C894" },
  { name: "Woven Wicker SW 9104", hex: "#B99974" },
  { name: "Flan SW 6652", hex: "#F4D4AF" },
  { name: "Fallen Leaves SW 9114", hex: "#8F7659" },
  { name: "Keystone Gray SW 7504", hex: "#9E9284" },
  { name: "Dovetail SW 7018", hex: "#908A83" },
  { name: "Brainstorm Bronze SW 7033", hex: "#74685A" },
  { name: "Morris Room Grey SW 0037", hex: "#ADA193" },
  { name: "Simple White SW 7021", hex: "#DFD9D2" },
  { name: "Gold Coast SW 6376", hex: "#C78538" },
  { name: "Colony Buff SW 7723", hex: "#DDC6AB" },
  { name: "Mega Greige SW 7031", hex: "#ADA295" },
  { name: "Polvo de Oro SW 9012", hex: "#E8B87F" },
  { name: "Intricate Ivory SW 6350", hex: "#EDDDCA" },
  { name: "Cachet Cream SW 6365", hex: "#F3D9BA" },
  { name: "Curio Gray SW 0024", hex: "#988977" },
  { name: "Superior Bronze SW 6152", hex: "#786957" },
  { name: "Tony Taupe SW 7038", hex: "#B1A290" },
  { name: "Pavilion Beige SW 7512", hex: "#C5B6A4" },
  { name: "Rookwood Antique Gold SW 2814", hex: "#A58258" },
  { name: "Townhall Tan SW 7690", hex: "#C3AA8C" },
  { name: "Cut the Mustard SW 6384", hex: "#BA7F38" },
  { name: "Bosc Pear SW 6390", hex: "#C09056" },
  { name: "Resort Tan SW 7550", hex: "#907D66" },
  { name: "Sandy Ridge SW 7535", hex: "#A18E77" },
  { name: "Antler Velvet SW 9111", hex: "#C0AD96" },
  { name: "Hubbard Squash SW 0044", hex: "#E9BF8C" },
  { name: "Torchlight SW 6374", hex: "#E5AE6B" },
  { name: "August Moon SW 7687", hex: "#E7C7A0" },
  { name: "Protégé Bronze SW 6153", hex: "#66543E" },
  { name: "Porcelain SW 0053", hex: "#E9E0D5" },
  { name: "Impressive Ivory SW 7560", hex: "#F4DEC3" },
  { name: "Taupe Tone SW 7633", hex: "#ADA090" },
  { name: "Ceremonial Gold SW 6382", hex: "#D69E59" },
  { name: "Baguette SW 6123", hex: "#B39167" },
  { name: "Pier SW 7545", hex: "#63523D" },
  { name: "Malabar SW 9110", hex: "#CFBEA9" },
  { name: "Nantucket Dune SW 7527", hex: "#D0BFAA" },
  { name: "Vintage Gold SW 9024", hex: "#CBA576" },
  { name: "Tres Naturale SW 9101", hex: "#DCC7AD" },
  { name: "Dapper Tan SW 6144", hex: "#947F65" },
  { name: "Mannered Gold SW 6130", hex: "#C19763" },
  { name: "Bellini Fizz SW 9008", hex: "#F5C78E" },
  { name: "Chamois SW 6131", hex: "#AD8451" },
  { name: "Bauhaus Buff SW 7552", hex: "#E7DBCC" },
  { name: "Golden Rule SW 6383", hex: "#CC9249" },
  { name: "Gallant Gold SW 6391", hex: "#A4763C" },
  { name: "Harvester SW 6373", hex: "#EDC38E" },
  { name: "Relic Bronze SW 6132", hex: "#906A3A" },
  { name: "Stonebriar SW 7693", hex: "#CBA97E" },
  { name: "Stone Lion SW 7507", hex: "#B3A491" },
  { name: "Serengeti Grass SW 9116", hex: "#AB9579" },
  { name: "Curry SW 6671", hex: "#D88F32" },
  { name: "Yarrow SW 6669", hex: "#EBAD5E" },
  { name: "Inviting Ivory SW 6372", hex: "#F2D5B0" },
  { name: "Kilim Beige SW 6106", hex: "#D7C5AE" },
  { name: "Travertine SW 7722", hex: "#ECD3B3" },
  { name: "Porpoise SW 7047", hex: "#6B645B" },
  { name: "Requisite Gray SW 7023", hex: "#B9B2A9" },
  { name: "Butternut SW 6389", hex: "#CC9B5C" },
  { name: "Anjou Pear SW 6381", hex: "#DDAC6D" },
  { name: "Belvedere Cream SW 0067", hex: "#F0CDA0" },
  { name: "Biscuit SW 6112", hex: "#EBDDCB" },
  { name: "Humble Gold SW 6380", hex: "#EDC796" },
  { name: "Artisan Tan SW 7540", hex: "#B09879" },
  { name: "Cork Wedge SW 7539", hex: "#C1A98A" },
  { name: "Golden Fleece SW 6388", hex: "#D6AD78" },
  { name: "Restrained Gold SW 6129", hex: "#D2B084" },
  { name: "Coriander Powder SW 9025", hex: "#BA9C75" },
  { name: "Row House Tan SW 7689", hex: "#D2BB9D" },
  { name: "Basket Beige SW 6143", hex: "#C0A98B" },
  { name: "Dakota Wheat SW 9023", hex: "#E1BD8E" },
  { name: "Rivers Edge SW 7517", hex: "#DBCEBD" },
  { name: "Dromedary Camel SW 7694", hex: "#CAAD87" },
  { name: "Compatible Cream SW 6387", hex: "#E8C89E" },
  { name: "Lotus Pod SW 7572", hex: "#E7D7C2" },
  { name: "Classical Gold SW 2831", hex: "#EBB875" },
  { name: "Olde World Gold SW 7700", hex: "#8F6C3E" },
  { name: "Outerbanks SW 7534", hex: "#B7A48B" },
  { name: "Buckram Binding SW 0036", hex: "#D9C3A6" },
  { name: "Bee's Wax SW 7682", hex: "#EABF86" },
  { name: "Natural Linen SW 9109", hex: "#DFD3C3" },
  { name: "Patience SW 7555", hex: "#E2D3BF" },
  { name: "Macadamia SW 6142", hex: "#CCB79B" },
  { name: "Amazing Gray SW 7044", hex: "#BEB5A9" },
  { name: "Anew Gray SW 7030", hex: "#BFB6AA" },
  { name: "Barcelona Beige SW 7530", hex: "#C4B39C" },
  { name: "Studio Taupe SW 7549", hex: "#AD9C85" },
  { name: "Eggwhite SW 6364", hex: "#F3E5D2" },
  { name: "Sunrise SW 6668", hex: "#F4BF77" },
  { name: "Moderate White SW 6140", hex: "#E9DECF" },
  { name: "Croissant SW 7716", hex: "#DBC5A7" },
  { name: "Honey Blush SW 6660", hex: "#F5CF9B" },
  { name: "Camelback SW 6122", hex: "#C5AA85" },
  { name: "Pewter Tankard SW 0023", hex: "#A39B90" },
  { name: "Portico SW 7548", hex: "#BBAB95" },
  { name: "Urban Jungle SW 9117", hex: "#A4947E" },
  { name: "Worldly Gray SW 7043", hex: "#CEC6BB" },
  { name: "Modern Gray SW 7632", hex: "#D6CEC3" },
  { name: "Olden Amber SW 9013", hex: "#EEB76B" },
  { name: "Loggia SW 7506", hex: "#C4B7A5" },
  { name: "Crisp Linen SW 6378", hex: "#F3E6D4" },
  { name: "Gold Crest SW 6670", hex: "#DF9938" },
  { name: "Blonde SW 6128", hex: "#DCBD92" },
  { name: "Colonial Yellow SW 0030", hex: "#EFC488" },
  { name: "Champagne SW 6644", hex: "#F2E3CE" },
  { name: "Quiver Tan SW 6151", hex: "#8E7F6A" },
  { name: "Artifact SW 6138", hex: "#9A815E" },
  { name: "Urban Putty SW 7532", hex: "#CFC0AB" },
  { name: "Kestrel White SW 7516", hex: "#E0D6C8" },
  { name: "Incredible White SW 7028", hex: "#E3DED7" },
  { name: "Arcade White SW 7100", hex: "#F3EEE7" },
  { name: "Ambitious Amber SW 6366", hex: "#F0CB97" },
  { name: "Safari SW 7697", hex: "#CCB18B" },
  { name: "Hinoki SW 7686", hex: "#F8DDB7" },
  { name: "Sunflower SW 6678", hex: "#E39A33" },
  { name: "Khaki Shade SW 7533", hex: "#C0AF97" },
  { name: "Shiitake SW 9173", hex: "#C8BCAB" },
  { name: "Verde Marrón SW 9124", hex: "#877459" },
  { name: "Pavestone SW 7642", hex: "#A0998F" },
  { name: "White Hyacinth SW 0046", hex: "#F3E5D1" },
  { name: "Cupola Yellow SW 7692", hex: "#DCBC8E" },
  { name: "Empire Gold SW 0012", hex: "#C19F6E" },
  { name: "Enjoyable Yellow SW 6666", hex: "#F5D6A9" },
  { name: "Sconce Gold SW 6398", hex: "#996F32" },
  { name: "Steamed Milk SW 7554", hex: "#ECE1D1" },
  { name: "Toasted Pine Nut SW 7696", hex: "#DCC6A6" },
  { name: "Whole Wheat SW 6121", hex: "#CDB592" },
  { name: "Maison Blanche SW 7526", hex: "#DFD2BF" },
  { name: "High Tea SW 6159", hex: "#7E6F59" },
  { name: "Birdseye Maple SW 2834", hex: "#E4C495" },
  { name: "Gardenia SW 6665", hex: "#F3E2C9" },
  { name: "Captivating Cream SW 6659", hex: "#F4D9B1" },
  { name: "Downing Straw SW 2813", hex: "#CAAB7D" },
  { name: "Natural Tan SW 7567", hex: "#DCD2C3" },
  { name: "Urbane Bronze SW 7048", hex: "#54504A" },
  { name: "Prairie Grass SW 7546", hex: "#B1A38E" },
  { name: "Windfresh White SW 7628", hex: "#DED8CF" },
  { name: "Oliva Oscuro SW 9125", hex: "#665439" },
  { name: "Windsor Greige SW 7528", hex: "#C4B49C" },
  { name: "Mossy Gold SW 6139", hex: "#7F6743" },
  { name: "Softer Tan SW 6141", hex: "#DACAB2" },
  { name: "Oak Leaf Brown SW 7054", hex: "#645A4B" },
  { name: "Accessible Beige SW 7036", hex: "#D1C7B8" },
  { name: "Sandbar SW 7547", hex: "#CBBFAD" },
  { name: "Divine White SW 6105", hex: "#E6DCCD" },
  { name: "Cotton White SW 7104", hex: "#F7EFE3" },
  { name: "Eider White SW 7014", hex: "#E2DED8" },
  { name: "Jersey Cream SW 6379", hex: "#F5DEBB" },
  { name: "Favorite Tan SW 6157", hex: "#C1AE91" },
  { name: "Irish Cream SW 7537", hex: "#E3D2B8" },
  { name: "Universal Khaki SW 6150", hex: "#B8A992" },
  { name: "Downing Sand SW 2822", hex: "#CBBCA5" },
  { name: "Afterglow SW 6667", hex: "#F6CD8E" },
  { name: "Downing Earth SW 2820", hex: "#887B67" },
  { name: "Pale Yellow SW 7691", hex: "#E3C9A1" },
  { name: "Ivoire SW 6127", hex: "#E4CEAC" },
  { name: "Believable Buff SW 6120", hex: "#DBC7A8" },
  { name: "Sundew SW 7688", hex: "#E1CDAE" },
  { name: "Enduring Bronze SW 7055", hex: "#554C3E" },
  { name: "Paper Lantern SW 7676", hex: "#F2E0C4" },
  { name: "Napery SW 6386", hex: "#EFDDC1" },
  { name: "Sawdust SW 6158", hex: "#998970" },
  { name: "Eaglet Beige SW 7573", hex: "#E9D9C0" },
  { name: "Welcome White SW 6658", hex: "#F3E3CA" },
  { name: "Roycroft Brass SW 2843", hex: "#7A6A51" },
  { name: "Burlap SW 6137", hex: "#AC9571" },
  { name: "Goldenrod SW 6677", hex: "#F2AF46" },
  { name: "Downy SW 7002", hex: "#EFE8DD" },
  { name: "White Raisin SW 7685", hex: "#E5C28B" },
  { name: "Futon SW 7101", hex: "#EDE6DB" },
  { name: "Peace Yellow SW 2857", hex: "#EECF9E" },
  { name: "Casa Blanca SW 7571", hex: "#EDE1CE" },
  { name: "Best Bronze SW 6160", hex: "#5D513E" },
  { name: "Rustic City SW 7699", hex: "#BA9A67" },
  { name: "Trinket SW 6685", hex: "#D69835" },
  { name: "Acier SW 9170", hex: "#9E9991" },
  { name: "Zurich White SW 7626", hex: "#E6E1D9" },
  { name: "Toque White SW 7003", hex: "#E7E2DA" },
  { name: "Sand Beach SW 7529", hex: "#D4C5AD" },
  { name: "Concord Buff SW 7684", hex: "#EDD6B1" },
  { name: "Classic Ivory SW 0051", hex: "#F2E0C3" },
  { name: "Stucco SW 7569", hex: "#DCCFBA" },
  { name: "Intellectual Gray SW 7045", hex: "#A8A093" },
  { name: "Pacer White SW 6098", hex: "#E5DDD0" },
  { name: "Canvas Tan SW 7531", hex: "#DCD1BF" },
  { name: "Tarnished Trumpet SW 9026", hex: "#D5B176" },
  { name: "Snowbound SW 7004", hex: "#EDEAE5" },
  { name: "Colonnade Gray SW 7641", hex: "#C6C0B6" },
  { name: "Agreeable Gray SW 7029", hex: "#D1CBC1" },
  { name: "Egret White SW 7570", hex: "#DFD9CF" },
  { name: "White Heron SW 7627", hex: "#E7E1D7" },
  { name: "Cottage Cream SW 7678", hex: "#EDDBBD" },
  { name: "Peristyle Brass SW 0043", hex: "#AE905E" },
  { name: "Chopsticks SW 7575", hex: "#E0D1B8" },
  { name: "Vanillin SW 6371", hex: "#F2E3CA" },
  { name: "Nankeen SW 6397", hex: "#AA803A" },
  { name: "Analytical Gray SW 7051", hex: "#BFB6A7" },
  { name: "Crewel Tan SW 0011", hex: "#CBB99B" },
  { name: "Buff SW 7683", hex: "#F1DFC1" },
  { name: "Pewter Cast SW 7673", hex: "#9B9893" },
  { name: "Aesthetic White SW 7035", hex: "#E3DDD3" },
  { name: "Sawgrass Basket SW 9121", hex: "#C3B090" },
  { name: "Ramie SW 6156", hex: "#CDBDA2" },
  { name: "Navajo White SW 6126", hex: "#E9DCC6" },
  { name: "Décor White SW 7559", hex: "#F2E5CF" },
  { name: "Aged White SW 9180", hex: "#E8DECD" },
  { name: "Tea Light SW 7681", hex: "#F8E4C2" },
  { name: "Barro Verde SW 9123", hex: "#9F8E71" },
  { name: "Different Gold SW 6396", hex: "#BC934D" },
  { name: "Sequin SW 6394", hex: "#E1C28D" },
  { name: "Fawn Brindle SW 7640", hex: "#A7A094" },
  { name: "Skyline Steel SW 1015", hex: "#C6BFB3" },
  { name: "Shoji White SW 7042", hex: "#E6DFD3" },
  { name: "Anonymous SW 7046", hex: "#817A6E" },
  { name: "Brittlebush SW 6684", hex: "#EAAE47" },
  { name: "Tumblin' Tumbleweed SW 9120", hex: "#CDBB9C" },
  { name: "Dried Edamame SW 9122", hex: "#B19F80" },
  { name: "Summer White SW 7557", hex: "#F4E9D6" },
  { name: "Ecru SW 6135", hex: "#D0BA94" },
  { name: "Harmonic Tan SW 6136", hex: "#C6B08A" },
  { name: "Naturel SW 7542", hex: "#CBC0AD" },
  { name: "Afternoon SW 6675", hex: "#FBCB78" },
  { name: "Echelon Ecru SW 7574", hex: "#E7D8BE" },
  { name: "Fenland SW 7544", hex: "#AC9D83" },
  { name: "Butterfield SW 6676", hex: "#F7BE5B" },
  { name: "Roycroft Suede SW 2842", hex: "#A79473" },
  { name: "Alchemy SW 6395", hex: "#C99E53" },
  { name: "Panda White SW 6147", hex: "#EAE2D4" },
  { name: "Thunder Gray SW 7645", hex: "#57534C" },
  { name: "Adaptive Shade SW 7053", hex: "#867E70" },
  { name: "Studio Clay SW 9172", hex: "#958D7F" },
  { name: "Pollen Powder SW 9014", hex: "#FBD187" },
  { name: "Gray Area SW 7052", hex: "#AFA696" },
  { name: "San Antonio Sage SW 7731", hex: "#A69474" },
  { name: "Dorian Gray SW 7017", hex: "#ACA79E" },
  { name: "City Loft SW 7631", hex: "#DFDAD1" },
  { name: "Marshmallow SW 7001", hex: "#EEE9E0" },
  { name: "Medici Ivory SW 7558", hex: "#F3E9D7" },
  { name: "Pussywillow SW 7643", hex: "#B2ADA4" },
  { name: "Tarnished Treasure SW 9118", hex: "#B9A47E" },
  { name: "Netsuke SW 6134", hex: "#E0CFB0" },
  { name: "Crème SW 7556", hex: "#F4E8D2" },
  { name: "Jonquil SW 6674", hex: "#F7D391" },
  { name: "Classical Yellow SW 2865", hex: "#F8D492" },
  { name: "Antique White SW 6119", hex: "#E8DCC6" },
  { name: "Bee SW 6683", hex: "#F1BA55" },
  { name: "Relaxed Khaki SW 6149", hex: "#C8BBA3" },
  { name: "Morning Sun SW 6672", hex: "#F3E6CE" },
  { name: "Felted Wool SW 9171", hex: "#979083" },
  { name: "Ivory Lace SW 7013", hex: "#ECE5D8" },
  { name: "Creamy SW 7012", hex: "#EFE8DB" },
  { name: "Sunbeam Yellow SW 0078", hex: "#F0D39D" },
  { name: "Roycroft Vellum SW 2833", hex: "#E8D9BD" },
  { name: "Muddled Basil SW 7745", hex: "#5A5243" },
  { name: "Gusto Gold SW 6904", hex: "#F8AC1D" },
  { name: "Ethereal Mood SW 7639", hex: "#AEA594" },
  { name: "Grecian Ivory SW 7541", hex: "#D8CFBE" },
  { name: "Auric SW 6692", hex: "#C48919" },
  { name: "Honied White SW 7106", hex: "#F8EEDB" },
  { name: "Oyster Bar SW 7565", hex: "#DBD0BB" },
  { name: "June Day SW 6682", hex: "#F6C973" },
  { name: "Avenue Tan SW 7543", hex: "#BCB099" },
  { name: "Drift of Mist SW 9166", hex: "#DCD8D0" },
  { name: "Mindful Gray SW 7016", hex: "#BCB7AD" },
  { name: "Pearly White SW 7009", hex: "#E8E3D9" },
  { name: "White Flour SW 7102", hex: "#F4EFE5" },
  { name: "Dirty Martini SW 9119", hex: "#DDD0B6" },
  { name: "Classical White SW 2829", hex: "#ECE1CB" },
  { name: "Zeus SW 7744", hex: "#99907E" },
  { name: "Neutral Ground SW 7568", hex: "#E2DACA" },
  { name: "Straw Harvest SW 7698", hex: "#DBC8A2" },
  { name: "Convivial Yellow SW 6393", hex: "#E9D6B0" },
  { name: "Muslin SW 6133", hex: "#EADFC9" },
  { name: "Gossamer Veil SW 9165", hex: "#D3CEC4" },
  { name: "Snowfall SW 6000", hex: "#E0DEDA" },
  { name: "Banana Cream SW 6673", hex: "#F5DEAF" },
  { name: "Vital Yellow SW 6392", hex: "#EDE0C5" },
  { name: "Meadow Trail SW 7737", hex: "#8D8168" },
  { name: "Rice Grain SW 6155", hex: "#DBD0B9" },
  { name: "La Luna Amarilla SW 9016", hex: "#FDDFA0" },
  { name: "Wool Skein SW 6148", hex: "#D9CFBA" },
  { name: "Naples Yellow SW 9021", hex: "#F6D58F" },
  { name: "Hardware SW 6172", hex: "#8B8372" },
  { name: "Paperwhite SW 7105", hex: "#F7EFDE" },
  { name: "They call it Mellow SW 9015", hex: "#FBE4B3" },
  { name: "Grandiose SW 6404", hex: "#9C7F41" },
  { name: "Fervent Brass SW 6405", hex: "#95793D" },
  { name: "Gambol Gold SW 6690", hex: "#E1B047" },
  { name: "Lucent Yellow SW 6400", hex: "#E4D0A5" },
  { name: "Edgy Gold SW 6409", hex: "#B1975F" },
  { name: "Golden Plumeria SW 9019", hex: "#FBD073" },
  { name: "White Duck SW 7010", hex: "#E5DFD2" },
  { name: "Eminent Bronze SW 6412", hex: "#7A6841" },
  { name: "Glitzy Gold SW 6691", hex: "#D6A02B" },
  { name: "Dusted Olive SW 9028", hex: "#BEA775" },
  { name: "Shell White SW 8917", hex: "#F0EBE0" },
  { name: "Whitetail SW 7103", hex: "#F4EFE4" },
  { name: "Antiquity SW 6402", hex: "#C2A462" },
  { name: "Westhighland White SW 7566", hex: "#F3EEE3" },
  { name: "Renwick Olive SW 2815", hex: "#97896A" },
  { name: "Bunglehouse Gray SW 2845", hex: "#988F7B" },
  { name: "Wheat Grass SW 6408", hex: "#CBB584" },
  { name: "Friendly Yellow SW 6680", hex: "#F5E0B1" },
  { name: "Heron Plume SW 6070", hex: "#E5E1D8" },
  { name: "Overjoy SW 6689", hex: "#EEC25F" },
  { name: "Honey Bees SW 9018", hex: "#FBD682" },
  { name: "Escapade Gold SW 6403", hex: "#B89B59" },
  { name: "Yellow Bird SW 9022", hex: "#F1CD7B" },
  { name: "Cocoon SW 6173", hex: "#726B5B" },
  { name: "Jogging Path SW 7638", hex: "#C0B9A9" },
  { name: "Pale Moss SW 9027", hex: "#DCC797" },
  { name: "Solaria SW 6688", hex: "#F5D68F" },
  { name: "Independent Gold SW 6401", hex: "#D2BA83" },
  { name: "Full Moon SW 6679", hex: "#F4E3BC" },
  { name: "Solé SW 6896", hex: "#F7DDA1" },
  { name: "Crispy Gold SW 6699", hex: "#C49832" },
  { name: "Butter Up SW 6681", hex: "#F6DDA3" },
  { name: "Crushed Ice SW 7647", hex: "#D6D3CC" },
  { name: "Nacre SW 6154", hex: "#E8E2D4" },
  { name: "Classic Light Buff SW 0050", hex: "#F0EADC" },
  { name: "Dover White SW 6385", hex: "#F0EADC" },
  { name: "Roman Column SW 7562", hex: "#F6F0E2" },
  { name: "Rayo de Sol SW 9020", hex: "#F4C454" },
  { name: "Polar Bear SW 7564", hex: "#E8DFCA" },
  { name: "Nugget SW 6697", hex: "#DBB04A" },
  { name: "Roycroft Mist Gray SW 2844", hex: "#C2BDB1" },
  { name: "Midday SW 6695", hex: "#F7D78A" },
  { name: "Quilt Gold SW 6696", hex: "#EAC365" },
  { name: "Sunny Veranda SW 9017", hex: "#FEDF94" },
  { name: "Brassy SW 6410", hex: "#9D8344" },
  { name: "Bengal Grass SW 6411", hex: "#8E773F" },
  { name: "Ancestral Gold SW 6407", hex: "#DDCDA6" },
  { name: "Messenger Bag SW 7740", hex: "#7D745E" },
  { name: "Kingdom Gold SW 6698", hex: "#D1A436" },
  { name: "Cargo Pants SW 7738", hex: "#CDC4AE" },
  { name: "Techno Gray SW 6170", hex: "#BFB9AA" },
  { name: "Knitting Needles SW 7672", hex: "#C3C1BC" },
  { name: "Light French Gray SW 0055", hex: "#C2C0BB" },
  { name: "Big Chill SW 7648", hex: "#D0CEC9" },
  { name: "Greek Villa SW 7551", hex: "#F0ECE2" },
  { name: "Lemon Chiffon SW 6686", hex: "#F5E5BC" },
  { name: "Decisive Yellow SW 6902", hex: "#FDCC4E" },
  { name: "Goldfinch SW 6905", hex: "#FDB702" },
  { name: "Useful Gray SW 7050", hex: "#CFCABD" },
  { name: "Rushing River SW 7746", hex: "#A19C8F" },
  { name: "Oyster White SW 7637", hex: "#E2DDD0" },
  { name: "Glad Yellow SW 6694", hex: "#F5E1AC" },
  { name: "Origami White SW 7636", hex: "#E5E2DA" },
  { name: "Silver Gray SW 0049", hex: "#B8B2A2" },
  { name: "Gateway Gray SW 7644", hex: "#B2AC9C" },
  { name: "Lantern Light SW 6687", hex: "#F4E1AE" },
  { name: "Lemon Meringue SW 7561", hex: "#F5EACC" },
  { name: "Garden Sage SW 7736", hex: "#B1A584" },
  { name: "Herbal Wash SW 7739", hex: "#A49B82" },
  { name: "Natural Choice SW 7011", hex: "#E3DED0" },
  { name: "Restful White SW 7563", hex: "#EEE8D7" },
  { name: "Bamboo Shoot SW 7733", hex: "#B3A479" },
  { name: "Restoration Ivory SW 6413", hex: "#E9E1CA" },
  { name: "Daffodil SW 6901", hex: "#FAD97A" },
  { name: "Cheerful SW 6903", hex: "#FFC723" },
  { name: "Optimistic Yellow SW 6900", hex: "#F5E1A6" },
  { name: "Repose Gray SW 7015", hex: "#CCC9C0" },
  { name: "Chatroom SW 6171", hex: "#B0AB9C" },
  { name: "March Wind SW 7668", hex: "#BAB9B6" },
  { name: "Zircon SW 7667", hex: "#CAC9C6" },
  { name: "Chamomile SW 6399", hex: "#E9E0C5" },
  { name: "Silverplate SW 7649", hex: "#C2C0BA" },
  { name: "On the Rocks SW 7671", hex: "#D0CEC8" },
  { name: "Summit Gray SW 7669", hex: "#959491" },
  { name: "Garden Gate SW 6167", hex: "#5E5949" },
  { name: "Ionic Ivory SW 6406", hex: "#E7DFC5" },
  { name: "Sassy Green SW 6416", hex: "#BBA86A" },
  { name: "Ruskin Room Green SW 0042", hex: "#ACA17D" },
  { name: "Rice Paddy SW 6414", hex: "#DFD4B0" },
  { name: "Alabaster SW 7008", hex: "#EDEAE0" },
  { name: "Lemon Twist SW 6909", hex: "#FED95D" },
  { name: "Lemongrass SW 7732", hex: "#C8BD98" },
  { name: "Honed Soapstone SW 9126", hex: "#9D9887" },
  { name: "Connected Gray SW 6165", hex: "#898473" },
  { name: "Daisy SW 6910", hex: "#FED340" },
  { name: "Cool Avocado SW 9029", hex: "#C4B47D" },
  { name: "Avocado SW 2861", hex: "#857C5D" },
  { name: "Olive Grove SW 7734", hex: "#857C5D" },
  { name: "Lily SW 6693", hex: "#F3E8C2" },
  { name: "Venetian Yellow SW 1666", hex: "#F6E3A1" },
  { name: "Palm Leaf SW 7735", hex: "#635936" },
  { name: "Sedate Gray SW 6169", hex: "#D1CDBF" },
  { name: "Eye Catching SW 6914", hex: "#DDB835" },
  { name: "Sheraton Sage SW 0014", hex: "#8F8666" },
  { name: "Forsythia SW 6907", hex: "#FFC801" },
  { name: "Funky Yellow SW 6913", hex: "#EDD26F" },
  { name: "Svelte Sage SW 6164", hex: "#B2AC96" },
  { name: "Hearts of Palm SW 6415", hex: "#CFC291" },
  { name: "Ancient Marble SW 6162", hex: "#D1CCB9" },
  { name: "Confident Yellow SW 6911", hex: "#FECB01" },
  { name: "Downing Stone SW 2821", hex: "#A6A397" },
  { name: "At Ease Soldier SW 9127", hex: "#9E9985" },
  { name: "Eclipse SW 6166", hex: "#6B6757" },
  { name: "Daybreak SW 6700", hex: "#F3EAC6" },
  { name: "Grassland SW 6163", hex: "#C1BCA7" },
  { name: "Moonraker SW 6701", hex: "#EEE3B2" },
  { name: "Icy Lemonade SW 1667", hex: "#F4E8B2" },
  { name: "Fun Yellow SW 6908", hex: "#F7E594" },
  { name: "Moderne White SW 6168", hex: "#E2E0D7" },
  { name: "Koi Pond SW 7727", hex: "#B9B292" },
  { name: "Pineapple Cream SW 1668", hex: "#F2EAC3" },
  { name: "Citronella SW 6915", hex: "#CBA901" },
  { name: "Andiron SW 6174", hex: "#424036" },
  { name: "Ellie Gray SW 7650", hex: "#AAA9A4" },
  { name: "First Star SW 7646", hex: "#DAD9D4" },
  { name: "Nuance SW 7049", hex: "#E2E0D6" },
  { name: "Sage SW 2860", hex: "#B3AE95" },
  { name: "Classic French Gray SW 0077", hex: "#888782" },
  { name: "Chartreuse SW 0073", hex: "#E1D286" },
  { name: "Lively Yellow SW 6702", hex: "#E6D88E" },
  { name: "Frolic SW 6703", hex: "#D9C661" },
  { name: "Hep Green SW 6704", hex: "#C4B146" },
  { name: "Edamame SW 7729", hex: "#827C5A" },
  { name: "Limón Fresco SW 9030", hex: "#CEBC55" },
  { name: "Tupelo Tree SW 6417", hex: "#9C9152" },
  { name: "High Strung SW 6705", hex: "#AC9825" },
  { name: "Sage Green Light SW 2851", hex: "#73705E" },
  { name: "Pure White SW 7005", hex: "#EDECE6" },
  { name: "Rural Green SW 6418", hex: "#8D844D" },
  { name: "Offbeat Green SW 6706", hex: "#9C8B1F" },
  { name: "Lemon Verbena SW 7726", hex: "#9D986F" },
  { name: "Saguaro SW 6419", hex: "#655F2D" },
  { name: "Ethereal White SW 6182", hex: "#E3E2D9" },
  { name: "Humorous Green SW 6918", hex: "#C6B836" },
  { name: "Thunderous SW 6201", hex: "#6D6C62" },
  { name: "Conservative Gray SW 6183", hex: "#D1D0C6" },
  { name: "Sensible Hue SW 6198", hex: "#B6B5AB" },
  { name: "Green Sprout SW 7728", hex: "#A29F80" },
  { name: "Queen Anne's Lace SW 6420", hex: "#ECEAD5" },
  { name: "Green Earth SW 7748", hex: "#9A9883" },
  { name: "Celery SW 6421", hex: "#E0DDBD" },
  { name: "Link Gray SW 6200", hex: "#7F7E72" },
  { name: "Nonchalant White SW 6161", hex: "#DEDDD1" },
  { name: "Verdant SW 6713", hex: "#847E35" },
  { name: "Springtime SW 6708", hex: "#E9E5B3" },
  { name: "Mountain Road SW 7743", hex: "#868578" },
  { name: "Parakeet SW 6711", hex: "#B4B05A" },
  { name: "Shagreen SW 6422", hex: "#CBC99D" },
  { name: "Baby Bok Choy SW 9037", hex: "#BBB98A" },
  { name: "Gleeful SW 6709", hex: "#DAD790" },
  { name: "Ryegrass SW 6423", hex: "#AEAC7A" },
  { name: "Primavera SW 9031", hex: "#D2D083" },
  { name: "Tansy Green SW 6424", hex: "#95945C" },
  { name: "Luau Green SW 6712", hex: "#989746" },
  { name: "Westchester Gray SW 2849", hex: "#797978" },
  { name: "Iron Ore SW 7069", hex: "#434341" },
  { name: "Stamped Concrete SW 7655", hex: "#A0A09A" },
  { name: "Gray Clouds SW 7658", hex: "#B7B7B2" },
  { name: "Argos SW 7065", hex: "#BDBDB7" },
  { name: "Cast Iron SW 6202", hex: "#64645A" },
  { name: "Cornwall Slate SW 9131", hex: "#949488" },
  { name: "Rare Gray SW 6199", hex: "#A6A69B" },
  { name: "Front Porch SW 7651", hex: "#CCCCC5" },
  { name: "Lattice SW 7654", hex: "#CECEC6" },
  { name: "Aloof Gray SW 6197", hex: "#C9C9C0" },
  { name: "Frosty White SW 6196", hex: "#DDDDD6" },
  { name: "Reserved White SW 7056", hex: "#E0E0D9" },
  { name: "Spare White SW 6203", hex: "#E4E4DD" },
  { name: "Liveable Green SW 6176", hex: "#CECEBD" },
  { name: "Acanthus SW 0029", hex: "#CDCDB4" },
  { name: "Sagey SW 6175", hex: "#E2E2D1" },
  { name: "High Reflective White SW 7757", hex: "#F7F7F1" },
  { name: "Sprout SW 6427", hex: "#E4E4CE" },
  { name: "Relentless Olive SW 6425", hex: "#71713E" },
  { name: "Mélange Green SW 6710", hex: "#C4C476" },
  { name: "Basque Green SW 6426", hex: "#5F6033" },
  { name: "Clary Sage SW 6178", hex: "#ACAD97" },
  { name: "Softened Green SW 6177", hex: "#BBBCA7" },
  { name: "Majolica Green SW 0013", hex: "#AEB08F" },
  { name: "Honeydew SW 6428", hex: "#DBDDBD" },
  { name: "Austere Gray SW 6184", hex: "#BEBFB2" },
  { name: "Escape Gray SW 6185", hex: "#ABAC9F" },
  { name: "Green Onyx SW 9128", hex: "#989A82" },
  { name: "Center Stage SW 6920", hex: "#B2C216" },
  { name: "Recycled Glass SW 7747", hex: "#BDC0A0" },
  { name: "Artichoke SW 6179", hex: "#7F8266" },
  { name: "Oakmoss SW 6180", hex: "#65684C" },
  { name: "Lime Granita SW 6715", hex: "#DCE1B8" },
  { name: "Attitude Gray SW 7060", hex: "#7C7D75" },
  { name: "Secret Garden SW 6181", hex: "#4F523A" },
  { name: "Lime Rickey SW 6717", hex: "#AFB96A" },
  { name: "Dancing Green SW 6716", hex: "#C5CD8F" },
  { name: "Chelsea Gray SW 2850", hex: "#B6B7B0" },
  { name: "Silverpointe SW 7653", hex: "#D1D2CB" },
  { name: "Evergreen Fog SW 9130", hex: "#95978A" },
  { name: "Baize Green SW 6429", hex: "#C7CDA8" },
  { name: "Stay in Lime SW 9032", hex: "#9FAC5C" },
  { name: "Gecko SW 6719", hex: "#7A8833" },
  { name: "Gray Matters SW 7066", hex: "#A7A8A2" },
  { name: "Filmy Green SW 6190", hex: "#D1D3C7" },
  { name: "Cucuzza Verde SW 9038", hex: "#9BA373" },
  { name: "Overt Green SW 6718", hex: "#97A554" },
  { name: "Leapfrog SW 6431", hex: "#88915D" },
  { name: "Willow Tree SW 7741", hex: "#AAAD9C" },
  { name: "Garden Spot SW 6432", hex: "#6D7645" },
  { name: "Great Green SW 6430", hex: "#ABB486" },
  { name: "Fleur de Sel SW 7666", hex: "#DCDDD8" },
  { name: "Extra White SW 7006", hex: "#EEEFEA" },
  { name: "Paradise SW 6720", hex: "#6C7B30" },
  { name: "Electric Lime SW 6921", hex: "#9ABA25" },
  { name: "Contented SW 6191", hex: "#BDC0B3" },
  { name: "Rookwood Jade SW 2812", hex: "#979F7F" },
  { name: "Inverness SW 6433", hex: "#576238" },
  { name: "Cascade Green SW 0066", hex: "#ACB19F" },
  { name: "Spinach White SW 6434", hex: "#E4E8DA" },
  { name: "Illusive Green SW 9164", hex: "#92948D" },
  { name: "Shade-Grown SW 6188", hex: "#4E5147" },
  { name: "Dried Thyme SW 6186", hex: "#7B8070" },
  { name: "Night Owl SW 7061", hex: "#63655F" },
  { name: "Nebulous White SW 7063", hex: "#DEDFDC" },
  { name: "Pearl Gray SW 0052", hex: "#CBCEC5" },
  { name: "Passive SW 7064", hex: "#CBCCC9" },
  { name: "Ice Cube SW 6252", hex: "#E3E4E1" },
  { name: "Frostwork SW 0059", hex: "#CBD0C2" },
  { name: "Ripe Olive SW 6209", hex: "#44483D" },
  { name: "Opaline SW 6189", hex: "#DCDFD7" },
  { name: "Gratifying Green SW 6435", hex: "#DAE2CD" },
  { name: "Rosemary SW 6187", hex: "#64695C" },
  { name: "Bonsai Tint SW 6436", hex: "#C5D1B2" },
  { name: "Coastal Plain SW 6192", hex: "#9FA694" },
  { name: "Laurel Woods SW 7749", hex: "#44493D" },
  { name: "Haven SW 6437", hex: "#A3B48C" },
  { name: "Silver Strand SW 7057", hex: "#C8CBC4" },
  { name: "Cucumber SW 6722", hex: "#D3DFC3" },
  { name: "Broccoflower SW 9039", hex: "#8FA277" },
  { name: "Pewter Green SW 6208", hex: "#5E6259" },
  { name: "Jade Dragon SW 9129", hex: "#909886" },
  { name: "Forestwood SW 7730", hex: "#4D5346" },
  { name: "Dill SW 6438", hex: "#788D60" },
  { name: "Lacewing SW 6729", hex: "#D7E3CA" },
  { name: "Mesclun Green SW 6724", hex: "#9DB682" },
  { name: "Romaine SW 6730", hex: "#C0D2AD" },
  { name: "Oyster Bay SW 6206", hex: "#AEB3A9" },
  { name: "Ceiling Bright White SW 7007", hex: "#E9EBE7" },
  { name: "Houseplant SW 6727", hex: "#58713F" },
  { name: "Magnetic Gray SW 7058", hex: "#B2B5AF" },
  { name: "Tin Lizzie SW 9163", hex: "#939591" },
  { name: "Pickle SW 6725", hex: "#85A16A" },
  { name: "Jardin SW 6723", hex: "#BDD0AB" },
  { name: "Greenfield SW 6439", hex: "#60724F" },
  { name: "Talipot Palm SW 6726", hex: "#648149" },
  { name: "Green Vibes SW 6928", hex: "#D4E7C3" },
  { name: "Seawashed Glass SW 9034", hex: "#A9C095" },
  { name: "White Mint SW 6441", hex: "#E0E7DA" },
  { name: "Foxhall Green SW 9184", hex: "#454B40" },
  { name: "Unusual Gray SW 7059", hex: "#A3A7A0" },
  { name: "Retreat SW 6207", hex: "#7A8076" },
  { name: "Acacia Haze SW 9132", hex: "#969C92" },
  { name: "Comfort Gray SW 6205", hex: "#BEC3BB" },
  { name: "Sea Salt SW 6204", hex: "#CDD2CA" },
  { name: "Oh Pistachio SW 9033", hex: "#ABCA99" },
  { name: "Supreme Green SW 6442", hex: "#CFDDC7" },
  { name: "Vogue Green SW 0065", hex: "#4B5645" },
  { name: "Cityscape SW 7067", hex: "#7F817E" },
  { name: "Grizzle Gray SW 7068", hex: "#636562" },
  { name: "Picnic SW 6731", hex: "#99C285" },
  { name: "Lounge Green SW 6444", hex: "#8BA97F" },
  { name: "Privilege Green SW 6193", hex: "#7A8775" },
  { name: "Organic Green SW 6732", hex: "#7FAC6E" },
  { name: "Relish SW 6443", hex: "#B3CBAA" },
  { name: "Agate Green SW 7742", hex: "#8EA486" },
  { name: "Direct Green SW 6924", hex: "#3F8A24" },
  { name: "Tinsmith SW 7657", hex: "#C5C8C4" },
  { name: "Reseda Green SW 9040", hex: "#75946B" },
  { name: "Courtyard SW 6440", hex: "#475842" },
  { name: "Nurture Green SW 6451", hex: "#98B092" },
  { name: "Topiary Tint SW 6449", hex: "#C8D8C4" },
  { name: "Garden Grove SW 6445", hex: "#5E7F57" },
  { name: "Arugula SW 6446", hex: "#42603C" },
  { name: "Easy Green SW 6450", hex: "#ACC2A8" },
  { name: "Inland SW 6452", hex: "#6C8867" },
  { name: "Basil SW 6194", hex: "#626E60" },
  { name: "Cilantro SW 6453", hex: "#537150" },
  { name: "Grasshopper SW 6733", hex: "#4F854A" },
  { name: "Jocular Green SW 6736", hex: "#CCE2CA" },
  { name: "Earl Grey SW 7660", hex: "#969A96" },
  { name: "Reflection SW 7661", hex: "#D3D5D3" },
  { name: "Site White SW 7070", hex: "#DCDEDC" },
  { name: "Rhinestone SW 7656", hex: "#DEE0DE" },
  { name: "Fleeting Green SW 6455", hex: "#D8E2D8" },
  { name: "Evergreens SW 6447", hex: "#405840" },
  { name: "Mint Condition SW 6743", hex: "#D1E3D2" },
  { name: "Kiwi SW 6737", hex: "#AED2B0" },
  { name: "Gallery Green SW 0015", hex: "#708672" },
  { name: "Envy SW 6925", hex: "#358C3F" },
  { name: "Window Pane SW 6210", hex: "#D7DFD8" },
  { name: "Rock Garden SW 6195", hex: "#465448" },
  { name: "Isle of Pines SW 6461", hex: "#3D5541" },
  { name: "Vegan SW 6738", hex: "#8EC298" },
  { name: "Olympic Range SW 7750", hex: "#424C44" },
  { name: "Slow Green SW 6456", hex: "#C6D5C9" },
  { name: "Kilkenny SW 6740", hex: "#498555" },
  { name: "Copen Blue SW 0068", hex: "#C2CCC4" },
  { name: "Mineral Deposit SW 7652", hex: "#ABB0AC" },
  { name: "Frosted Emerald SW 9035", hex: "#78B185" },
  { name: "Espalier SW 6734", hex: "#2F5F3A" },
  { name: "Rock Bottom SW 7062", hex: "#484C49" },
  { name: "Silvermist SW 7621", hex: "#B0B8B2" },
  { name: "Reclining Green SW 6744", hex: "#B7D7BF" },
  { name: "Eco Green SW 6739", hex: "#68A678" },
  { name: "Kale Green SW 6460", hex: "#4F6A56" },
  { name: "Rainwashed SW 6211", hex: "#C2CDC5" },
  { name: "Glimmer SW 6476", hex: "#E0E7E2" },
  { name: "Jasper SW 6216", hex: "#343B36" },
  { name: "Green Trance SW 6462", hex: "#D7E4DB" },
  { name: "Derbyshire SW 6741", hex: "#245E36" },
  { name: "Dard Hunter Green SW 0041", hex: "#3A4A3F" },
  { name: "Rock Candy SW 6231", hex: "#DEE1DF" },
  { name: "Jadite SW 6459", hex: "#61826C" },
  { name: "Quietude SW 6212", hex: "#ADBBB2" },
  { name: "Kind Green SW 6457", hex: "#AAC2B3" },
  { name: "Retro Mint SW 9036", hex: "#9FCDB1" },
  { name: "Parisian Patina SW 9041", hex: "#7D9B89" },
  { name: "Restful SW 6458", hex: "#91AF9D" },
  { name: "Shamrock SW 6454", hex: "#205134" },
  { name: "Lark Green SW 6745", hex: "#8AC1A1" },
  { name: "Billiard Green SW 0016", hex: "#45584D" },
  { name: "Homburg Gray SW 7622", hex: "#666D69" },
  { name: "Roycroft Bottle Green SW 2847", hex: "#324038" },
  { name: "Halcyon Green SW 6213", hex: "#9BAAA2" },
  { name: "Lucky Green SW 6926", hex: "#238652" },
  { name: "Breaktime SW 6463", hex: "#C4D9CE" },
  { name: "Argyle SW 6747", hex: "#348A5D" },
  { name: "Julep SW 6746", hex: "#57AA80" },
  { name: "Grandview SW 6466", hex: "#6B927F" },
  { name: "Waterscape SW 6470", hex: "#BFD2C9" },
  { name: "Kendal Green SW 6467", hex: "#547867" },
  { name: "Alexandrite SW 0060", hex: "#598C74" },
  { name: "Aloe SW 6464", hex: "#ACCABC" },
  { name: "Spearmint SW 6465", hex: "#94B5A6" },
  { name: "Embellished Blue SW 6749", hex: "#D7EBE2" },
  { name: "Verdigreen SW 9042", hex: "#81A595" },
  { name: "Jasper Stone SW 9133", hex: "#8D9E97" },
  { name: "Greenbelt SW 6927", hex: "#017244" },
  { name: "Quicksilver SW 6245", hex: "#DDE2E0" },
  { name: "Vintage Vessel SW 9050", hex: "#94B2A6" },
  { name: "Hazel SW 6471", hex: "#A8C1B7" },
  { name: "Underseas SW 6214", hex: "#7C8E87" },
  { name: "Greens SW 6748", hex: "#016844" },
  { name: "Calico SW 0017", hex: "#8CA49C" },
  { name: "Rocky River SW 6215", hex: "#5E706A" },
  { name: "Hunt Club SW 6468", hex: "#2A4F43" },
  { name: "Jitterbug Jade SW 6987", hex: "#019D6E" },
  { name: "Studio Blue Green SW 0047", hex: "#6D817B" },
  { name: "Composed SW 6472", hex: "#7EA298" },
  { name: "Starboard SW 6755", hex: "#016C4F" },
  { name: "Surf Green SW 6473", hex: "#5F887D" },
  { name: "Waterfall SW 6750", hex: "#C0E3DA" },
  { name: "Larchmere SW 6752", hex: "#70BAA7" },
  { name: "Monorail Silver SW 7663", hex: "#B8BCBB" },
  { name: "Gris SW 7659", hex: "#A5A9A8" },
  { name: "Olympus White SW 6253", hex: "#D4D8D7" },
  { name: "Raging Sea SW 6474", hex: "#476F65" },
  { name: "Jargon Jade SW 6753", hex: "#53A38F" },
  { name: "Roycroft Pewter SW 2848", hex: "#616564" },
  { name: "Topsail SW 6217", hex: "#DAE2E0" },
  { name: "Aquastone SW 9043", hex: "#89C6B7" },
  { name: "Refresh SW 6751", hex: "#A1D4C8" },
  { name: "Ionian SW 6754", hex: "#368976" },
  { name: "Blue Sky SW 0063", hex: "#ABD1C9" },
  { name: "Tidewater SW 6477", hex: "#C3D7D3" },
  { name: "Aqueduct SW 6758", hex: "#A1D5CB" },
  { name: "Tame Teal SW 6757", hex: "#C1E6DF" },
  { name: "Little Blue Box SW 9044", hex: "#8AC5BA" },
  { name: "Rookwood Shutter Green SW 2809", hex: "#303B39" },
  { name: "Tantalizing Teal SW 6937", hex: "#87DCCE" },
  { name: "Cooled Blue SW 6759", hex: "#75B9AE" },
  { name: "Rivulet SW 6760", hex: "#61A89D" },
  { name: "Holiday Turquoise SW 0075", hex: "#8AC6BD" },
  { name: "Thermal Spring SW 6761", hex: "#3B8C80" },
  { name: "Country Squire SW 6475", hex: "#124A42" },
  { name: "Teal Stencil SW 0018", hex: "#627F7B" },
  { name: "Watery SW 6478", hex: "#B4CCC9" },
  { name: "Mountain Air SW 6224", hex: "#D8E0DF" },
  { name: "Snowdrop SW 6511", hex: "#E0E8E7" },
  { name: "Poseidon SW 6762", hex: "#016D60" },
  { name: "Festoon Aqua SW 0019", hex: "#A0BBB8" },
  { name: "Aquaverde SW 9051", hex: "#A3C0BD" },
  { name: "Meander Blue SW 6484", hex: "#BEDBD8" },
  { name: "Drizzle SW 6479", hex: "#8CAEAB" },
  { name: "Lagoon SW 6480", hex: "#518682" },
  { name: "Cape Verde SW 6482", hex: "#01554F" },
  { name: "Nifty Turquoise SW 6941", hex: "#019187" },
  { name: "Green Bay SW 6481", hex: "#2E6864" },
  { name: "Blue Horizon SW 6497", hex: "#D8E7E6" },
  { name: "Peacock Plume SW 0020", hex: "#739694" },
  { name: "Blue Peacock SW 0064", hex: "#014E4C" },
  { name: "Greenblack SW 6994", hex: "#373A3A" },
  { name: "Online SW 7072", hex: "#B0B5B5" },
  { name: "Colonial Revival Gray SW 2832", hex: "#B4B9B9" },
  { name: "Gray Screen SW 7071", hex: "#C6CACA" },
  { name: "Samovar Silver SW 6233", hex: "#B8BEBE" },
  { name: "Misty SW 6232", hex: "#CDD2D2" },
  { name: "Rarified Air SW 6525", hex: "#E1E6E6" },
  { name: "Dutch Tile Blue SW 0031", hex: "#9AABAB" },
  { name: "Lullaby SW 9136", hex: "#CBD4D4" },
  { name: "Tradewind SW 6218", hex: "#C2CFCF" },
  { name: "Cascades SW 7623", hex: "#273E3E" },
  { name: "Blithe Blue SW 9052", hex: "#90BDBD" },
  { name: "Raindrop SW 6485", hex: "#9EC6C6" },
  { name: "Bora Bora Shore SW 9045", hex: "#92D0D0" },
  { name: "Swimming SW 6764", hex: "#C2E5E5" },
  { name: "Spa SW 6765", hex: "#A7DCDC" },
  { name: "Reflecting Pool SW 6486", hex: "#7BB1B2" },
  { name: "Mariner SW 6766", hex: "#6EC2C4" },
  { name: "Splashy SW 6942", hex: "#019196" },
  { name: "Maxi Teal SW 6769", hex: "#017478" },
  { name: "Really Teal SW 6489", hex: "#016367" },
  { name: "Open Air SW 6491", hex: "#C7DFE0" },
  { name: "Moody Blue SW 6221", hex: "#7A9192" },
  { name: "Aquarium SW 6767", hex: "#3AA9AE" },
  { name: "Gulfstream SW 6768", hex: "#01858B" },
  { name: "Delft SW 9134", hex: "#8B9FA0" },
  { name: "Rain SW 6219", hex: "#ABBEBF" },
  { name: "Cloudburst SW 6487", hex: "#5C9598" },
  { name: "Calypso SW 6950", hex: "#01B0BB" },
  { name: "Grand Canal SW 6488", hex: "#3C797D" },
  { name: "Breezy SW 7616", hex: "#A0AEAF" },
  { name: "Niebla Azul SW 9137", hex: "#B6C3C4" },
  { name: "Intense Teal SW 6943", hex: "#017680" },
  { name: "Sky High SW 6504", hex: "#DCE7E8" },
  { name: "Riverway SW 6222", hex: "#5D7274" },
  { name: "Bravo Blue SW 6784", hex: "#D3E7E9" },
  { name: "Bathe Blue SW 6771", hex: "#C2E0E3" },
  { name: "Still Water SW 6223", hex: "#4A5D5F" },
  { name: "Blue Nile SW 6776", hex: "#01717E" },
  { name: "Briny SW 6775", hex: "#08808E" },
  { name: "Jetstream SW 6492", hex: "#B0D2D6" },
  { name: "Gentle Aquamarine SW 9046", hex: "#97CBD2" },
  { name: "Freshwater SW 6774", hex: "#4DA6B2" },
  { name: "Uncertain Gray SW 6234", hex: "#A9B0B1" },
  { name: "Deep Sea Dive SW 7618", hex: "#376167" },
  { name: "Cay SW 6772", hex: "#A6D0D6" },
  { name: "Rapture Blue SW 6773", hex: "#7DC1CB" },
  { name: "Interesting Aqua SW 6220", hex: "#9BAFB2" },
  { name: "Aqua-Sphere SW 7613", hex: "#9CB0B3" },
  { name: "Capri SW 6788", hex: "#01A0B8" },
  { name: "Cruising SW 6782", hex: "#018498" },
  { name: "Quench Blue SW 6785", hex: "#B4E0E7" },
  { name: "Mediterranean SW 7617", hex: "#60797D" },
  { name: "Jamaica Bay SW 6781", hex: "#34A3B6" },
  { name: "Aviary Blue SW 6778", hex: "#C6E3E8" },
  { name: "Byte Blue SW 6498", hex: "#C5DCE0" },
  { name: "Great Falls SW 6495", hex: "#217786" },
  { name: "Little Boy Blu SW 9054", hex: "#C7D8DB" },
  { name: "Agua Fría SW 9053", hex: "#9FC5CC" },
  { name: "Mountain Stream SW 7612", hex: "#679199" },
  { name: "Oceanside SW 6496", hex: "#015A6B" },
  { name: "African Gray SW 9162", hex: "#939899" },
  { name: "Tranquil Aqua SW 7611", hex: "#7C9AA0" },
  { name: "Cloudless SW 6786", hex: "#8FD0DD" },
  { name: "Sleepy Blue SW 6225", hex: "#BCCBCE" },
  { name: "Lakeshore SW 6494", hex: "#5B96A2" },
  { name: "Ebbtide SW 6493", hex: "#84B4BE" },
  { name: "Amalfi SW 6783", hex: "#016E85" },
  { name: "Nautilus SW 6780", hex: "#71B8C7" },
  { name: "Iceberg SW 6798", hex: "#D6E4E7" },
  { name: "Liquid Blue SW 6779", hex: "#A6D4DE" },
  { name: "Fountain SW 6787", hex: "#56B5CA" },
  { name: "Minor Blue SW 6792", hex: "#B7DFE8" },
  { name: "Stream SW 6499", hex: "#ADCCD3" },
  { name: "Blue Mosque SW 6789", hex: "#01819E" },
  { name: "After the Rain SW 9047", hex: "#8BC4D1" },
  { name: "Surfin' SW 9048", hex: "#73C0D2" },
  { name: "Refuge SW 6228", hex: "#607D84" },
  { name: "Icicle SW 6238", hex: "#DBDFE0" },
  { name: "Billowy Breeze SW 9055", hex: "#AFC7CD" },
  { name: "Atmospheric SW 6505", hex: "#C2DAE0" },
  { name: "Stardew SW 9138", hex: "#A6B2B5" },
  { name: "Aquitaine SW 9057", hex: "#88ABB4" },
  { name: "Bosporus SW 6503", hex: "#015D75" },
  { name: "Connor's Lakefront SW 9060", hex: "#175A6C" },
  { name: "Rest Assured SW 9061", hex: "#9BBFC9" },
  { name: "Loch Blue SW 6502", hex: "#2F778B" },
  { name: "French Moire SW 9056", hex: "#9FBBC3" },
  { name: "Manitou Blue SW 6501", hex: "#5B92A2" },
  { name: "Silken Peacock SW 9059", hex: "#427584" },
  { name: "Open Seas SW 6500", hex: "#83AFBC" },
  { name: "Tempe Star SW 6229", hex: "#47626A" },
  { name: "Foggy Day SW 6235", hex: "#727C7F" },
  { name: "Meditative SW 6227", hex: "#96AAB0" },
  { name: "Languid Blue SW 6226", hex: "#A4B7BD" },
  { name: "Balmy SW 6512", hex: "#C5D8DE" },
  { name: "Moscow Midnight SW 9142", hex: "#204652" },
  { name: "Whirlpool SW 9135", hex: "#80969D" },
  { name: "Soar SW 6799", hex: "#C3DFE8" },
  { name: "Major Blue SW 6795", hex: "#289EC4" },
  { name: "St. Bart's SW 7614", hex: "#577C88" },
  { name: "Secret Cove SW 9058", hex: "#68909D" },
  { name: "Evening Shadow SW 7662", hex: "#C9CCCD" },
  { name: "North Star SW 6246", hex: "#CAD0D2" },
  { name: "Powder Blue SW 2863", hex: "#89A4AD" },
  { name: "Dark Night SW 6237", hex: "#23383F" },
  { name: "Adriatic Sea SW 6790", hex: "#016081" },
  { name: "Blue Plate SW 6796", hex: "#017CA7" },
  { name: "Bluebell SW 6793", hex: "#A2D5E7" },
  { name: "Dynamic Blue SW 6958", hex: "#0192C6" },
  { name: "Mount Etna SW 7625", hex: "#3D484C" },
  { name: "Labradorite SW 7619", hex: "#657B83" },
  { name: "Hinting Blue SW 6519", hex: "#CED9DD" },
  { name: "Loyal Blue SW 6510", hex: "#01455E" },
  { name: "Krypton SW 6247", hex: "#B8C0C3" },
  { name: "Debonair SW 9139", hex: "#90A0A6" },
  { name: "Cadet SW 9143", hex: "#91999C" },
  { name: "Blustery Sky SW 9140", hex: "#6F848C" },
  { name: "Turkish Tile SW 7610", hex: "#3E758A" },
  { name: "Rainstorm SW 6230", hex: "#244653" },
  { name: "Flyway SW 6794", hex: "#5DB3D4" },
  { name: "Georgian Bay SW 6509", hex: "#22657F" },
  { name: "Seaworthy SW 7620", hex: "#314D58" },
  { name: "Software SW 7074", hex: "#7F8486" },
  { name: "Network Gray SW 7073", hex: "#A0A5A7" },
  { name: "Sky Fall SW 9049", hex: "#89C6DF" },
  { name: "Marea Baja SW 9185", hex: "#2E5464" },
  { name: "Something Blue SW 6800", hex: "#B0D6E6" },
  { name: "Slate Tile SW 7624", hex: "#606E74" },
  { name: "Adrift SW 7608", hex: "#87AAB9" },
  { name: "Moonmist SW 9144", hex: "#C9D9E0" },
  { name: "Vast Sky SW 6506", hex: "#A9C9D7" },
  { name: "Undercool SW 6957", hex: "#7FC3E1" },
  { name: "Sleepy Hollow SW 9145", hex: "#B7C9D1" },
  { name: "Secure Blue SW 6508", hex: "#5389A1" },
  { name: "Take Five SW 6513", hex: "#B3C9D3" },
  { name: "Jay Blue SW 6797", hex: "#015D87" },
  { name: "Resolute Blue SW 6507", hex: "#85B0C4" },
  { name: "Dockside Blue SW 7601", hex: "#A0B3BC" },
  { name: "Waterloo SW 9141", hex: "#536872" },
  { name: "Bluebird Feather SW 9062", hex: "#6F9DB3" },
  { name: "Bunglehouse Blue SW 0048", hex: "#47626F" },
  { name: "Porch Ceiling SW 9063", hex: "#9BC8DE" },
  { name: "Morning Fog SW 6255", hex: "#A8AEB1" },
  { name: "Jubilee SW 6248", hex: "#ADB5B9" },
  { name: "Grays Harbor SW 6236", hex: "#596368" },
  { name: "Santorini Blue SW 7607", hex: "#416D83" },
  { name: "Jacaranda SW 6802", hex: "#5A9EC0" },
  { name: "Regatta SW 6517", hex: "#215772" },
  { name: "Danube SW 6803", hex: "#2377A2" },
  { name: "Respite SW 6514", hex: "#97B4C3" },
  { name: "Blue Cruise SW 7606", hex: "#6591A8" },
  { name: "Blue Chip SW 6959", hex: "#016EA7" },
  { name: "Poolhouse SW 7603", hex: "#8095A0" },
  { name: "Smoky Blue SW 7604", hex: "#596E79" },
  { name: "Leisure Blue SW 6515", hex: "#6A8EA1" },
  { name: "Regale Blue SW 6801", hex: "#7DB5D3" },
  { name: "Faded Flaxflower SW 9146", hex: "#9EB4C0" },
  { name: "Needlepoint Navy SW 0032", hex: "#546670" },
  { name: "Favorite Jeans SW 9147", hex: "#8AA3B1" },
  { name: "Gale Force SW 7605", hex: "#35454E" },
  { name: "Down Pour SW 6516", hex: "#43718B" },
  { name: "Steely Gray SW 7664", hex: "#90979B" },
  { name: "Honest Blue SW 6520", hex: "#B2C7D3" },
  { name: "Endless Sea SW 9150", hex: "#32586E" },
  { name: "Baby Blue Eyes SW 9070", hex: "#83A2B4" },
  { name: "Dignity Blue SW 6804", hex: "#094C73" },
  { name: "Inky Blue SW 9149", hex: "#4E7287" },
  { name: "Smoky Azurite SW 9148", hex: "#708D9E" },
  { name: "Hyper Blue SW 6965", hex: "#015F97" },
  { name: "Web Gray SW 7075", hex: "#616669" },
  { name: "Mild Blue SW 6533", hex: "#CBD5DB" },
  { name: "Lazy Gray SW 6254", hex: "#BEC1C3" },
  { name: "Rhythmic Blue SW 6806", hex: "#CCDBE5" },
  { name: "Blueblood SW 6966", hex: "#015086" },
  { name: "Sea Serpent SW 7615", hex: "#3E4B54" },
  { name: "Icelandic SW 6526", hex: "#CBD8E1" },
  { name: "Upward SW 6239", hex: "#BFC9D0" },
  { name: "Notable Hue SW 6521", hex: "#8BA7BB" },
  { name: "Bracing Blue SW 6242", hex: "#768B9A" },
  { name: "Blissful Blue SW 6527", hex: "#B2C8D8" },
  { name: "Daphne SW 9151", hex: "#899CAA" },
  { name: "Wall Street SW 7665", hex: "#656D73" },
  { name: "Black of Night SW 6993", hex: "#323639" },
  { name: "Let it Rain SW 9152", hex: "#979FA5" },
  { name: "Windy Blue SW 6240", hex: "#AABAC6" },
  { name: "Wondrous Blue SW 6807", hex: "#B8CDDD" },
  { name: "Dyer's Woad SW 9071", hex: "#7B99B0" },
  { name: "Outerspace SW 6251", hex: "#586168" },
  { name: "Inkwell SW 6992", hex: "#31363A" },
  { name: "Sporty Blue SW 6522", hex: "#6A8AA4" },
  { name: "Aleutian SW 6241", hex: "#98A9B7" },
  { name: "Salty Dog SW 9177", hex: "#234058" },
  { name: "Dustblu SW 9161", hex: "#959BA0" },
  { name: "Downing Slate SW 2819", hex: "#777F86" },
  { name: "Scanda SW 6529", hex: "#6B8CA9" },
  { name: "Distance SW 6243", hex: "#5D6F7F" },
  { name: "Storm Cloud SW 6249", hex: "#7A848D" },
  { name: "Bluesy Note SW 9064", hex: "#7C9AB5" },
  { name: "Granite Peak SW 6250", hex: "#606B75" },
  { name: "Icy SW 6534", hex: "#BBC7D2" },
  { name: "Denim SW 6523", hex: "#506B84" },
  { name: "Cosmos SW 6528", hex: "#8EA9C2" },
  { name: "Serious Gray SW 6256", hex: "#7D848B" },
  { name: "Revel Blue SW 6530", hex: "#4C6B8A" },
  { name: "Gibraltar SW 6257", hex: "#626970" },
  { name: "Commodore SW 6524", hex: "#25476A" },
  { name: "Celestial SW 6808", hex: "#97B3D0" },
  { name: "Honorable Blue SW 6811", hex: "#164576" },
  { name: "Indigo Batik SW 7602", hex: "#3E5063" },
  { name: "Lobelia SW 6809", hex: "#7498BE" },
  { name: "In the Navy SW 9178", hex: "#283849" },
  { name: "Naval SW 6244", hex: "#2F3D4C" },
  { name: "Indigo SW 6531", hex: "#284A70" },
  { name: "Frank Blue SW 6967", hex: "#225288" },
  { name: "Perfect Periwinkle SW 9065", hex: "#6487B0" },
  { name: "Lupine SW 6810", hex: "#4E739F" },
  { name: "Dress Blues SW 9176", hex: "#2B4360" },
  { name: "Solitude SW 6535", hex: "#99A7B8" },
  { name: "Cyberspace SW 7076", hex: "#44484D" },
  { name: "Dried Lavender SW 9072", hex: "#8595AA" },
  { name: "Searching Blue SW 6536", hex: "#6C7F9A" },
  { name: "Anchors Aweigh SW 9179", hex: "#2B3441" },
  { name: "Luxe Blue SW 6537", hex: "#516582" },
  { name: "Starry Night SW 6540", hex: "#D6D9DE" },
  { name: "Daydream SW 6541", hex: "#BDC3CD" },
  { name: "Breathtaking SW 6814", hex: "#C7D1E2" },
  { name: "Charcoal Blue SW 2739", hex: "#3D4450" },
  { name: "Wishful Blue SW 6813", hex: "#D8DDE6" },
  { name: "Mineral Gray SW 2740", hex: "#515763" },
  { name: "Hyacinth Tint SW 6968", hex: "#C2CBE0" },
  { name: "Agapanthus SW 9066", hex: "#BBC5DE" },
  { name: "Vesper Violet SW 6542", hex: "#99A0B2" },
  { name: "Dignified SW 6538", hex: "#3B496D" },
  { name: "Dusty Heather SW 9073", hex: "#8990A3" },
  { name: "Mesmerize SW 6544", hex: "#5D657B" },
  { name: "Soulful Blue SW 6543", hex: "#757C91" },
  { name: "Awesome Violet SW 6815", hex: "#A7B2D4" },
  { name: "Morning Glory SW 6971", hex: "#3C4C80" },
  { name: "Dahlia SW 6816", hex: "#8B98C4" },
  { name: "Gentian SW 6817", hex: "#6572A5" },
  { name: "Valiant Violet SW 6818", hex: "#3E4371" },
  { name: "Majestic Purple SW 6545", hex: "#3B3C5A" },
  { name: "Tricorn Black SW 6258", hex: "#2F2F30" },
  { name: "Fully Purple SW 6983", hex: "#514C7E" },
  { name: "Forget-Me-Not SW 6824", hex: "#716998" },
  { name: "Dewberry SW 6552", hex: "#3E385A" },
  { name: "Brave Purple SW 6823", hex: "#968DB8" },
  { name: "Purple Passage SW 6551", hex: "#645E77" },
  { name: "Izmir Purple SW 6825", hex: "#4D426E" },
  { name: "Wisteria SW 6822", hex: "#BDB4D4" },
  { name: "Forever Lilac SW 9067", hex: "#AFA5C7" },
  { name: "Potentially Purple SW 6821", hex: "#D1CBDF" },
  { name: "Mythical SW 6550", hex: "#7E778E" },
  { name: "Quixotic Plum SW 6265", hex: "#4A4653" },
  { name: "Elation SW 6827", hex: "#DFDCE5" },
  { name: "Gentle Grape SW 9074", hex: "#908A9B" },
  { name: "African Violet SW 6982", hex: "#665385" },
  { name: "Cloak Gray SW 6278", hex: "#605E63" },
  { name: "Concord Grape SW 6559", hex: "#443757" },
  { name: "Black Swan SW 6279", hex: "#3A373E" },
  { name: "Midnight SW 6264", hex: "#5D5962" },
  { name: "Exclusive Plum SW 6263", hex: "#736F78" },
  { name: "Ash Violet SW 6549", hex: "#A29BAA" },
  { name: "Rhapsody Lilac SW 6828", hex: "#D2C8DD" },
  { name: "Plummy SW 6558", hex: "#675A75" },
  { name: "Berry Frappé SW 9068", hex: "#B3A1C6" },
  { name: "Domino SW 6989", hex: "#353337" },
  { name: "Perle Noir SW 9154", hex: "#4F4D51" },
  { name: "Mysterious Mauve SW 6262", hex: "#A6A3A9" },
  { name: "Clematis SW 6831", hex: "#7E6596" },
  { name: "Kismet SW 6830", hex: "#A18AB7" },
  { name: "Magical SW 6829", hex: "#C0AFD0" },
  { name: "Impulsive Purple SW 6832", hex: "#624977" },
  { name: "Inspired Lilac SW 6820", hex: "#DFD9E4" },
  { name: "Grape Mist SW 6548", hex: "#C5C0C9" },
  { name: "Wood Violet SW 6557", hex: "#7A6B85" },
  { name: "Special Gray SW 6277", hex: "#7B787D" },
  { name: "Berry Cream SW 9075", hex: "#9A8CA2" },
  { name: "Obi Lilac SW 6556", hex: "#B0A3B6" },
  { name: "Gris Morado SW 9156", hex: "#8F8A91" },
  { name: "Free Spirit SW 6973", hex: "#CAB2D2" },
  { name: "Passionate Purple SW 6981", hex: "#795484" },
  { name: "Silver Peony SW 6547", hex: "#DAD6DB" },
  { name: "Bohemian Black SW 6988", hex: "#3B373C" },
  { name: "Veri Berri SW 9069", hex: "#937496" },
  { name: "Enchant SW 6555", hex: "#D1C6D2" },
  { name: "Vigorous Violet SW 6838", hex: "#7C5A7E" },
  { name: "Kimono Violet SW 6839", hex: "#5D395F" },
  { name: "Black Magic SW 6991", hex: "#323132" },
  { name: "Caviar SW 6990", hex: "#313031" },
  { name: "Moonlit Orchid SW 9153", hex: "#949194" },
  { name: "Swanky Gray SW 6261", hex: "#B5B1B5" },
  { name: "Spangle SW 6834", hex: "#E5DBE5" },
  { name: "Baroness SW 6837", hex: "#A785A7" },
  { name: "Novel Lilac SW 6836", hex: "#C2A4C2" },
  { name: "Euphoric Lilac SW 6835", hex: "#DAC7DA" },
  { name: "Radiant Lilac SW 0074", hex: "#A489A0" },
  { name: "Lite Lavender SW 6554", hex: "#E0DADF" },
  { name: "Mature Grape SW 6286", hex: "#5F3F54" },
  { name: "Beguiling Mauve SW 6269", hex: "#AFA7AC" },
  { name: "Sensitive Tint SW 6267", hex: "#CEC9CC" },
  { name: "Deep Forest Brown SW 9175", hex: "#393437" },
  { name: "Stunning Shade SW 7082", hex: "#676064" },
  { name: "Grape Harvest SW 6285", hex: "#7E5A6D" },
  { name: "Veiled Violet SW 6268", hex: "#BDB5B9" },
  { name: "Dynamo SW 6841", hex: "#953D68" },
  { name: "Exuberant Pink SW 6840", hex: "#B54D7F" },
  { name: "Fabulous Grape SW 6293", hex: "#6D344F" },
  { name: "Expressive Plum SW 6271", hex: "#695C62" },
  { name: "Plum Dandy SW 6284", hex: "#8B6878" },
  { name: "Ruby Violet SW 9076", hex: "#9B7E8B" },
  { name: "Framboise SW 6566", hex: "#7C3655" },
  { name: "Irresistible SW 6562", hex: "#E3C0CF" },
  { name: "Thistle SW 6283", hex: "#AA8E9A" },
  { name: "Mauve Finery SW 6282", hex: "#CBB8C0" },
  { name: "Wallflower SW 6281", hex: "#DBCFD4" },
  { name: "Plum Brown SW 6272", hex: "#4E4247" },
  { name: "Forward Fuchsia SW 6842", hex: "#92345B" },
  { name: "Grandeur Plum SW 6565", hex: "#92576F" },
  { name: "Rosebay SW 6563", hex: "#CB9AAD" },
  { name: "Teaberry SW 6561", hex: "#EBD1DB" },
  { name: "Haute Pink SW 6570", hex: "#D899B1" },
  { name: "Childlike SW 6569", hex: "#E8C0CF" },
  { name: "Red Clover SW 6564", hex: "#B87E93" },
  { name: "Cyclamen SW 6571", hex: "#C47B95" },
  { name: "Blackberry SW 7577", hex: "#533640" },
  { name: "Juneberry SW 6573", hex: "#854158" },
  { name: "Sensuous Gray SW 7081", hex: "#837D7F" },
  { name: "Darkroom SW 7083", hex: "#443E40" },
  { name: "Lighthearted Pink SW 6568", hex: "#EDD5DD" },
  { name: "Rosé SW 6290", hex: "#B995A1" },
  { name: "Ruby Shade SW 6572", hex: "#A2566F" },
  { name: "Berry Bush SW 6292", hex: "#8D5869" },
  { name: "Hot SW 6843", hex: "#AC4362" },
  { name: "Merlot SW 2704", hex: "#51323B" },
  { name: "Delightful SW 6289", hex: "#D2B6BE" },
  { name: "Soulmate SW 6270", hex: "#85777B" },
  { name: "Dragon Fruit SW 6855", hex: "#CC617F" },
  { name: "Cerise SW 6580", hex: "#99324E" },
  { name: "In the Pink SW 6583", hex: "#F0BCC9" },
  { name: "Moss Rose SW 6291", hex: "#9E6D79" },
  { name: "Gala Pink SW 6579", hex: "#B04B63" },
  { name: "Azalea Flower SW 6576", hex: "#EFC0CB" },
  { name: "Priscilla SW 6575", hex: "#F1D3DA" },
  { name: "Autumn Orchid SW 9157", hex: "#9D9093" },
  { name: "Burgundy SW 6300", hex: "#63333E" },
  { name: "Aged Wine SW 6299", hex: "#895460" },
  { name: "Rosebud SW 6288", hex: "#E0CDD1" },
  { name: "Eros Pink SW 6860", hex: "#C84F68" },
  { name: "Grapy SW 7629", hex: "#786E70" },
  { name: "Mystical Shade SW 6276", hex: "#AEA9AA" },
  { name: "Concerto SW 6298", hex: "#9E6B75" },
  { name: "Cheery SW 6584", hex: "#EB92A3" },
  { name: "Cherries Jubilee SW 6862", hex: "#AB3C51" },
  { name: "Valentine SW 6587", hex: "#A53A4E" },
  { name: "Jaipur Pink SW 6577", hex: "#E392A1" },
  { name: "Tuberose SW 6578", hex: "#D47C8C" },
  { name: "Deep Maroon SW 0072", hex: "#623F45" },
  { name: "Heartfelt SW 6586", hex: "#BD4C5F" },
  { name: "Coming up Roses SW 6585", hex: "#DD7788" },
  { name: "Impatiens Petal SW 6582", hex: "#F1D2D7" },
  { name: "Radish SW 6861", hex: "#A42E41" },
  { name: "Poetry Plum SW 6019", hex: "#6F5C5F" },
  { name: "Audrey's Blush SW 9001", hex: "#AE8087" },
  { name: "Raisin SW 7630", hex: "#392B2D" },
  { name: "Slate Violet SW 9155", hex: "#989192" },
  { name: "Fine Wine SW 6307", hex: "#723941" },
  { name: "River Rouge SW 6026", hex: "#76595D" },
  { name: "Fading Rose SW 6296", hex: "#DABDC1" },
  { name: "Enigma SW 6018", hex: "#8B7C7E" },
  { name: "Borscht SW 7578", hex: "#72353D" },
  { name: "Kirsch Red SW 6313", hex: "#974953" },
  { name: "Intuitive SW 6017", hex: "#B3A3A5" },
  { name: "Amaryllis SW 6591", hex: "#ED939D" },
  { name: "Pink Flamingo SW 0080", hex: "#CD717B" },
  { name: "Loveable SW 6590", hex: "#F0C1C6" },
  { name: "Luxurious Red SW 6314", hex: "#863A42" },
  { name: "Cordial SW 6306", hex: "#864C52" },
  { name: "Rose Embroidery SW 6297", hex: "#C79EA2" },
  { name: "Wild Currant SW 7583", hex: "#7C3239" },
  { name: "Redbud SW 6312", hex: "#AD5E65" },
  { name: "Rambling Rose SW 6305", hex: "#995D62" },
  { name: "Grenadine SW 6592", hex: "#D66972" },
  { name: "Show Stopper SW 7588", hex: "#A42E37" },
  { name: "Alaea SW 7579", hex: "#81585B" },
  { name: "Alyssum SW 6589", hex: "#F2D5D7" },
  { name: "Rita's Rouge SW 9003", hex: "#BA7176" },
  { name: "Chaise Mauve SW 6016", hex: "#C1B2B3" },
  { name: "Coquina SW 9158", hex: "#9D8D8E" },
  { name: "Orchid SW 0071", hex: "#BC9C9E" },
  { name: "Positive Red SW 6871", hex: "#AD2C34" },
  { name: "Cordovan SW 6027", hex: "#5F3D3F" },
  { name: "Carley's Rose SW 9002", hex: "#A87376" },
  { name: "Coral Bells SW 6593", hex: "#BB4B51" },
  { name: "Deepest Mauve SW 0005", hex: "#6D595A" },
  { name: "Demure SW 6295", hex: "#E8D4D5" },
  { name: "Poinsettia SW 6594", hex: "#9D373C" },
  { name: "Patchwork Plum SW 0022", hex: "#7E696A" },
  { name: "Rose Brocade SW 0004", hex: "#996C6E" },
  { name: "Memorable Rose SW 6311", hex: "#CF8A8D" },
  { name: "Heartthrob SW 6866", hex: "#A82E33" },
  { name: "Stolen Kiss SW 7586", hex: "#813235" },
  { name: "Marooned SW 6020", hex: "#4E3132" },
  { name: "Real Red SW 6868", hex: "#BF2D32" },
  { name: "Begonia SW 6599", hex: "#D76C6E" },
  { name: "Red Theatre SW 7584", hex: "#6E3637" },
  { name: "Red Bay SW 6321", hex: "#8E3738" },
  { name: "Enticing Red SW 6600", hex: "#B74E4F" },
];

// Zone overlay colors for edit view (hue tints)
const ZONE_TINTS = [
  [60, 190, 220], // teal
  [220, 150, 50], // amber
  [180, 80, 220], // purple
  [80, 210, 120], // green
  [220, 80, 120], // pink
  [80, 160, 220], // blue
];

const MAX_UNDO = 50;

// ===== STATE =====
let img = null;
let imageDataUrl = null; // stored data URL of the loaded image
let originalData = null;
let maskData = null; // Uint8Array: 0=bg, 1=zone1, 2=zone2, ...

let zones = [
  { name: "Zone 1", color: "#D1CBC1" },
  { name: "Zone 2", color: "#CDD2CA" },
];
let activeZone = 0;

let intensity = 75;
let blendMode = "multiply";
let viewMode = "edit";
let activeTool = "brush";
let brushSize = 40;
let brushShape = "round"; // 'round' or 'square'
let fillTolerance = 32;

// Undo / redo
let undoStack = [];
let redoStack = [];
let currentDiff = null;

// Zoom / pan
let zoomScale = 1;
let panX = 0;
let panY = 0;
let isPanning = false;
let panStartX = 0;
let panStartY = 0;
let panStartPanX = 0;
let panStartPanY = 0;
let spaceHeld = false;

// Painting
let isPainting = false;
let lastPaintX = -1;
let lastPaintY = -1;

// Line tool
let lineStartImg = null; // {x, y} in image coords, null if no start set

// Compare
let compareSplit = 0.5;
let draggingSlider = false;

// Pinch zoom
let lastPinchDist = 0;
let lastPinchCenter = null;
let wasPinching = false;

// Elements
const mainCanvas = document.getElementById("mainCanvas");
const compareCanvas = document.getElementById("compareCanvas");
const mainCtx = mainCanvas.getContext("2d", { willReadFrequently: true });
const compareCtx = compareCanvas.getContext("2d", { willReadFrequently: true });
const canvasWrapper = document.getElementById("canvasWrapper");
const canvasContainer = document.getElementById("canvasContainer");
const startScreenEl = document.getElementById("startScreen");
const tooltipEl = document.getElementById("tooltip");
const brushCursor = document.getElementById("brushCursor");
const hintOverlay = document.getElementById("hintOverlay");

// ===== INIT =====
function init() {
  renderZoneList();
  renderPresets();
  setupEvents();
  setupStartScreen();
}

function setupImageFromDataUrl(dataUrl) {
  imageDataUrl = dataUrl;
  img = new Image();
  img.onload = () => {
    mainCanvas.width = img.width;
    mainCanvas.height = img.height;
    compareCanvas.width = img.width;
    compareCanvas.height = img.height;

    mainCtx.drawImage(img, 0, 0);
    originalData = mainCtx.getImageData(0, 0, img.width, img.height);

    maskData = new Uint8Array(img.width * img.height);

    // Try loading saved mask
    loadSavedMask();

    // Reset undo/redo for new image
    undoStack = [];
    redoStack = [];
    updateUndoButtons();

    resetZoom();
    render();
    startScreenEl.classList.add("hidden");

    // Show hint if mask is empty
    if (!maskData.some((v) => v > 0)) {
      showHint("Paint wall areas with the brush, then switch to Preview");
    }
  };
  img.src = dataUrl;
}

function loadImageFromFile(file) {
  const reader = new FileReader();
  reader.onload = () => setupImageFromDataUrl(reader.result);
  reader.readAsDataURL(file);
}

function openFilePicker(accept, callback) {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = accept;
  input.style.cssText = "position:fixed;top:-9999px;left:-9999px;opacity:0;";
  document.body.appendChild(input);
  input.addEventListener("change", () => {
    const file = input.files[0];
    document.body.removeChild(input);
    if (file) callback(file);
  });
  input.click();
}

function setupStartScreen() {
  document.getElementById("startLoadImage").addEventListener("click", () => {
    openFilePicker("image/*", loadImageFromFile);
  });

  document.getElementById("startOpenProject").addEventListener("click", () => {
    openFilePicker(".json", (file) => handleProjectOrMaskFile(file));
  });

  // Drag-and-drop
  const dropZone = document.getElementById("startDrop");
  startScreenEl.addEventListener("dragover", (e) => {
    e.preventDefault();
    dropZone.classList.add("dragover");
  });
  startScreenEl.addEventListener("dragleave", (e) => {
    if (!startScreenEl.contains(e.relatedTarget)) {
      dropZone.classList.remove("dragover");
    }
  });
  startScreenEl.addEventListener("drop", (e) => {
    e.preventDefault();
    dropZone.classList.remove("dragover");
    const file = e.dataTransfer.files[0];
    if (!file) return;
    if (file.name.endsWith(".json")) {
      handleProjectOrMaskFile(file);
    } else if (file.type.startsWith("image/")) {
      loadImageFromFile(file);
    }
  });
}

function handleProjectOrMaskFile(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result);
      if (data.version === 3 && data.image) {
        // v3 bundled project — load embedded image, then apply mask
        loadProjectV3(data);
      } else if (data.version === 2) {
        // v2 mask-only — needs an image already loaded
        if (!img) {
          alert("Load an image first before importing a v2 mask file.");
          return;
        }
        applyImportedMask(data);
      } else {
        alert("Unrecognized project file format.");
      }
    } catch {
      alert("Invalid project file.");
    }
  };
  reader.readAsText(file);
}

function loadProjectV3(data) {
  const tempImg = new Image();
  tempImg.onload = () => {
    imageDataUrl = data.image;
    img = tempImg;

    mainCanvas.width = img.width;
    mainCanvas.height = img.height;
    compareCanvas.width = img.width;
    compareCanvas.height = img.height;

    mainCtx.drawImage(img, 0, 0);
    originalData = mainCtx.getImageData(0, 0, img.width, img.height);

    maskData = rlDecode(data.mask, img.width * img.height);
    if (data.zones) {
      zones = data.zones;
      activeZone = 0;
      renderZoneList();
    }

    undoStack = [];
    redoStack = [];
    updateUndoButtons();

    resetZoom();
    render();
    setView("preview");
    startScreenEl.classList.add("hidden");
  };
  tempImg.src = data.image;
}

// ===== RENDERING =====
function applyColors(ctx) {
  const imageData = ctx.createImageData(img.width, img.height);
  const src = originalData.data;
  const dst = imageData.data;
  const alpha = intensity / 100;
  const mode = blendMode;
  const mask = maskData;
  const len = img.width * img.height;

  // Pre-compute normalized zone colors
  const zc = zones.map((z) => {
    const [r, g, b] = hexToRgb(z.color);
    return [r / 255, g / 255, b / 255];
  });

  for (let i = 0; i < len; i++) {
    const idx = i * 4;
    const zone = mask[i];
    if (zone > 0 && zone <= zc.length) {
      const [crN, cgN, cbN] = zc[zone - 1];
      const sr = src[idx] / 255,
        sg = src[idx + 1] / 255,
        sb = src[idx + 2] / 255;
      let br, bg, bb;
      if (mode === "multiply") {
        br = blendMultiply(sr, crN);
        bg = blendMultiply(sg, cgN);
        bb = blendMultiply(sb, cbN);
      } else if (mode === "overlay") {
        br = blendOverlay(sr, crN);
        bg = blendOverlay(sg, cgN);
        bb = blendOverlay(sb, cbN);
      } else {
        br = blendSoftLight(sr, crN);
        bg = blendSoftLight(sg, cgN);
        bb = blendSoftLight(sb, cbN);
      }
      dst[idx] = src[idx] + (br * 255 - src[idx]) * alpha;
      dst[idx + 1] = src[idx + 1] + (bg * 255 - src[idx + 1]) * alpha;
      dst[idx + 2] = src[idx + 2] + (bb * 255 - src[idx + 2]) * alpha;
    } else {
      dst[idx] = src[idx];
      dst[idx + 1] = src[idx + 1];
      dst[idx + 2] = src[idx + 2];
    }
    dst[idx + 3] = 255;
  }
  ctx.putImageData(imageData, 0, 0);
}

function renderEditView(ctx) {
  const imageData = ctx.createImageData(img.width, img.height);
  const src = originalData.data;
  const dst = imageData.data;
  const mask = maskData;
  const len = img.width * img.height;
  const alpha = intensity / 100;

  // Pre-compute zone colors for preview tint
  const zc = zones.map((z) => {
    const [r, g, b] = hexToRgb(z.color);
    return [r / 255, g / 255, b / 255];
  });

  for (let i = 0; i < len; i++) {
    const idx = i * 4;
    const zone = mask[i];
    if (zone > 0 && zone <= zones.length) {
      // Show actual color preview at reduced opacity
      const [crN, cgN, cbN] = zc[zone - 1];
      const sr = src[idx] / 255,
        sg = src[idx + 1] / 255,
        sb = src[idx + 2] / 255;
      // Multiply blend
      const br = sr * crN,
        bg = sg * cgN,
        bb = sb * cbN;
      const previewAlpha = alpha * 0.65;
      const r = src[idx] + (br * 255 - src[idx]) * previewAlpha;
      const g = src[idx + 1] + (bg * 255 - src[idx + 1]) * previewAlpha;
      const b = src[idx + 2] + (bb * 255 - src[idx + 2]) * previewAlpha;

      // Add subtle zone tint border
      const tint = ZONE_TINTS[(zone - 1) % ZONE_TINTS.length];
      const tintAmt = 0.12;
      dst[idx] = r * (1 - tintAmt) + tint[0] * tintAmt;
      dst[idx + 1] = g * (1 - tintAmt) + tint[1] * tintAmt;
      dst[idx + 2] = b * (1 - tintAmt) + tint[2] * tintAmt;
    } else {
      // Dim non-wall areas
      dst[idx] = src[idx] * 0.35;
      dst[idx + 1] = src[idx + 1] * 0.35;
      dst[idx + 2] = src[idx + 2] * 0.35;
    }
    dst[idx + 3] = 255;
  }
  ctx.putImageData(imageData, 0, 0);
}

let renderRAF = 0;
function render() {
  if (renderRAF) return;
  renderRAF = requestAnimationFrame(() => {
    renderRAF = 0;
    renderNow();
  });
}

function renderNow() {
  if (!originalData) return;
  const toolbar = document.getElementById("maskToolbar");

  if (viewMode === "edit") {
    renderEditView(mainCtx);
    compareCanvas.style.display = "none";
    document.getElementById("compareSlider").style.display = "none";
    document.getElementById("compareLabels").style.display = "none";
    toolbar.classList.add("visible");
    return;
  }

  toolbar.classList.remove("visible");

  if (viewMode === "compare") {
    applyColors(mainCtx);
    // compareCanvas shows original
    compareCtx.putImageData(originalData, 0, 0);
    compareCanvas.style.display = "block";
    document.getElementById("compareSlider").style.display = "block";
    document.getElementById("compareLabels").style.display = "flex";
    updateCompareClip();
  } else {
    // Preview
    applyColors(mainCtx);
    compareCanvas.style.display = "none";
    document.getElementById("compareSlider").style.display = "none";
    document.getElementById("compareLabels").style.display = "none";
  }
}

function updateCompareClip() {
  // Clip the compare canvas (original) to the left portion
  const pct = compareSplit * 100;
  compareCanvas.style.clipPath = `inset(0 ${100 - pct}% 0 0)`;

  // Position slider relative to the canvas's screen position
  const canvasRect = mainCanvas.getBoundingClientRect();
  const containerRect = canvasContainer.getBoundingClientRect();
  const sliderLeft =
    canvasRect.left - containerRect.left + canvasRect.width * compareSplit;
  document.getElementById("compareSlider").style.left = sliderLeft + "px";
}

// ===== MASK OPERATIONS =====
function beginStroke() {
  currentDiff = new Map();
  redoStack = [];
}

function endStroke() {
  if (currentDiff && currentDiff.size > 0) {
    undoStack.push(currentDiff);
    if (undoStack.length > MAX_UNDO) undoStack.shift();
  }
  currentDiff = null;
  updateUndoButtons();
}

function recordPixel(i, oldVal) {
  if (currentDiff && !currentDiff.has(i)) {
    currentDiff.set(i, oldVal);
  }
}

function undo() {
  if (undoStack.length === 0) return;
  const diff = undoStack.pop();
  const redo = new Map();
  for (const [i, oldVal] of diff) {
    redo.set(i, maskData[i]);
    maskData[i] = oldVal;
  }
  redoStack.push(redo);
  updateUndoButtons();
  render();
}

function redo() {
  if (redoStack.length === 0) return;
  const diff = redoStack.pop();
  const und = new Map();
  for (const [i, oldVal] of diff) {
    und.set(i, maskData[i]);
    maskData[i] = oldVal;
  }
  undoStack.push(und);
  updateUndoButtons();
  render();
}

function updateUndoButtons() {
  document.getElementById("undoBtn").disabled = undoStack.length === 0;
  document.getElementById("redoBtn").disabled = redoStack.length === 0;
}

function getImageCoords(clientX, clientY) {
  const rect = mainCanvas.getBoundingClientRect();
  const scaleX = img.width / rect.width;
  const scaleY = img.height / rect.height;
  return {
    x: (clientX - rect.left) * scaleX,
    y: (clientY - rect.top) * scaleY,
  };
}

function getImageBrushRadius() {
  const rect = mainCanvas.getBoundingClientRect();
  return brushSize * (img.width / rect.width);
}

function paintAt(cx, cy) {
  const w = img.width,
    h = img.height;
  const r = getImageBrushRadius();
  const val = activeTool === "erase" ? 0 : activeZone + 1;

  const x0 = Math.max(0, Math.floor(cx - r));
  const y0 = Math.max(0, Math.floor(cy - r));
  const x1 = Math.min(w - 1, Math.ceil(cx + r));
  const y1 = Math.min(h - 1, Math.ceil(cy + r));
  const isRound = brushShape === "round";
  const r2 = r * r;

  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      if (isRound) {
        const dx = x - cx,
          dy = y - cy;
        if (dx * dx + dy * dy > r2) continue;
      }
      const i = y * w + x;
      recordPixel(i, maskData[i]);
      maskData[i] = val;
    }
  }
}

function paintLine(x0, y0, x1, y1) {
  const dx = x1 - x0,
    dy = y1 - y0;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const step = Math.max(1, getImageBrushRadius() * 0.3);
  const steps = Math.ceil(dist / step);
  for (let i = 0; i <= steps; i++) {
    const t = steps === 0 ? 0 : i / steps;
    paintAt(x0 + dx * t, y0 + dy * t);
  }
  render();
}

function floodFill(startX, startY) {
  const w = img.width,
    h = img.height;
  const sx = Math.round(startX),
    sy = Math.round(startY);
  if (sx < 0 || sx >= w || sy < 0 || sy >= h) return;

  const src = originalData.data;
  const startI = sy * w + sx;
  const startIdx = startI * 4;
  const sr = src[startIdx],
    sg = src[startIdx + 1],
    sb = src[startIdx + 2];
  const tol2 = fillTolerance * fillTolerance * 3;
  const val = activeZone + 1;

  if (maskData[startI] === val) return;

  const visited = new Uint8Array(w * h);
  const queue = [startI];
  let qi = 0;
  visited[startI] = 1;

  beginStroke();

  while (qi < queue.length) {
    const i = queue[qi++];
    recordPixel(i, maskData[i]);
    maskData[i] = val;

    const x = i % w,
      y = (i / w) | 0;

    if (x > 0 && !visited[i - 1]) {
      visited[i - 1] = 1;
      const ni = (i - 1) * 4;
      const dr = src[ni] - sr,
        dg = src[ni + 1] - sg,
        db = src[ni + 2] - sb;
      if (dr * dr + dg * dg + db * db <= tol2) queue.push(i - 1);
    }
    if (x < w - 1 && !visited[i + 1]) {
      visited[i + 1] = 1;
      const ni = (i + 1) * 4;
      const dr = src[ni] - sr,
        dg = src[ni + 1] - sg,
        db = src[ni + 2] - sb;
      if (dr * dr + dg * dg + db * db <= tol2) queue.push(i + 1);
    }
    if (y > 0 && !visited[i - w]) {
      visited[i - w] = 1;
      const ni = (i - w) * 4;
      const dr = src[ni] - sr,
        dg = src[ni + 1] - sg,
        db = src[ni + 2] - sb;
      if (dr * dr + dg * dg + db * db <= tol2) queue.push(i - w);
    }
    if (y < h - 1 && !visited[i + w]) {
      visited[i + w] = 1;
      const ni = (i + w) * 4;
      const dr = src[ni] - sr,
        dg = src[ni + 1] - sg,
        db = src[ni + 2] - sb;
      if (dr * dr + dg * dg + db * db <= tol2) queue.push(i + w);
    }
  }

  endStroke();
  render();
}

function autoDetectWalls(targetZone) {
  const src = originalData.data;
  const w = img.width,
    h = img.height;
  const val = targetZone + 1;
  const len = w * h;

  beginStroke();

  for (let i = 0; i < len; i++) {
    if (maskData[i] !== 0) continue; // don't overwrite existing zones
    const idx = i * 4;
    const r = src[idx],
      g = src[idx + 1],
      b = src[idx + 2];
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const lightness = (max + min) / 2;
    const sat = max === 0 ? 0 : (max - min) / max;
    const isGreen = g > r * 1.15 && g > b * 1.15 && g > 80;
    const isWood = r > 100 && r > b * 1.4 && lightness < 150 && lightness > 40;
    const isDark = lightness < 60;

    if (lightness > 150 && sat < 0.25 && !isGreen && !isWood && !isDark) {
      recordPixel(i, maskData[i]);
      maskData[i] = val;
    }
  }

  endStroke();
  render();
}

// ===== ZOOM / PAN =====
function updateCanvasTransform() {
  canvasWrapper.style.transform = `translate(${panX}px, ${panY}px) scale(${zoomScale})`;
  document.getElementById("zoomDisplay").textContent =
    Math.round(zoomScale * 100) + "%";
}

function resetZoom() {
  if (!img) return;
  const cRect = canvasContainer.getBoundingClientRect();
  const scaleX = cRect.width / img.width;
  const scaleY = cRect.height / img.height;
  zoomScale = Math.min(scaleX, scaleY, 1);

  const displayW = img.width * zoomScale;
  const displayH = img.height * zoomScale;
  panX = (cRect.width - displayW) / 2;
  panY = (cRect.height - displayH) / 2;

  updateCanvasTransform();
}

function zoomAtPoint(factor, cx, cy) {
  const newScale = Math.max(0.1, Math.min(15, zoomScale * factor));
  const ratio = newScale / zoomScale;
  panX = cx - (cx - panX) * ratio;
  panY = cy - (cy - panY) * ratio;
  zoomScale = newScale;
  updateCanvasTransform();
}

// ===== SAVE / LOAD =====
function getMaskPayload() {
  return {
    version: 2,
    width: img.width,
    height: img.height,
    zones: zones,
    mask: rlEncode(maskData),
  };
}

function saveMask() {
  if (!img) return;
  localStorage.setItem("wallMaskData", JSON.stringify(getMaskPayload()));
  const btn = document.getElementById("saveMask");
  btn.textContent = "Saved!";
  setTimeout(() => {
    btn.textContent = "Save";
  }, 1500);
}

function getProjectPayload() {
  return {
    version: 3,
    width: img.width,
    height: img.height,
    zones: zones,
    mask: rlEncode(maskData),
    image: imageDataUrl,
  };
}

function exportMask() {
  if (!img) return;
  const json = JSON.stringify(getProjectPayload());
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "wall-project.json";
  a.click();
  URL.revokeObjectURL(url);
  const btn = document.getElementById("exportMask");
  btn.textContent = "Done!";
  setTimeout(() => {
    btn.textContent = "Export";
  }, 1500);
}

function applyImportedMask(data) {
  if (data.width !== img.width || data.height !== img.height) {
    alert("Mask dimensions do not match current image.");
    return;
  }
  if (data.version === 2 || data.version === 3) {
    maskData = rlDecode(data.mask, img.width * img.height);
    if (data.zones) {
      zones = data.zones;
      activeZone = 0;
      renderZoneList();
    }
  }
  undoStack = [];
  redoStack = [];
  updateUndoButtons();
  render();
}

function importMask() {
  openFilePicker(".json", (file) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        if (data.version === 3 && data.image) {
          loadProjectV3(data);
        } else if (data.version === 2) {
          if (!img) {
            alert("Load an image first before importing a v2 mask file.");
            return;
          }
          applyImportedMask(data);
        } else {
          alert("Unrecognized file format.");
          return;
        }
        const btn = document.getElementById("importMask");
        btn.textContent = "Loaded!";
        setTimeout(() => {
          btn.textContent = "Import";
        }, 1500);
      } catch {
        alert("Invalid mask file.");
      }
    };
    reader.readAsText(file);
  });
}

function loadSavedMask() {
  const raw = localStorage.getItem("wallMaskData");
  if (!raw) return;
  try {
    const data = JSON.parse(raw);
    if (data.width !== img.width || data.height !== img.height) return;

    if (data.version === 2) {
      maskData = rlDecode(data.mask, img.width * img.height);
      if (data.zones && data.zones.length > 0) {
        zones = data.zones;
        activeZone = 0;
        renderZoneList();
      }
    } else {
      // Legacy format: convert manualMask (Int8Array: 1=wall, -1=erased, 0=auto)
      const decoded = new Int8Array(
        data.mask ? rlDecodeSigned(data.mask, img.width * img.height) : [],
      );
      maskData = new Uint8Array(img.width * img.height);
      for (let i = 0; i < decoded.length; i++) {
        if (decoded[i] === 1) maskData[i] = 1;
      }
    }
  } catch {
    /* ignore bad data */
  }
}

// ===== ZONE MANAGEMENT =====
function renderZoneList() {
  const container = document.getElementById("zoneList");
  container.innerHTML = "";
  zones.forEach((z, i) => {
    const div = document.createElement("div");
    div.className = "zone-entry" + (i === activeZone ? " active" : "");
    div.innerHTML = `
      <div class="zone-swatch" style="background:${z.color}" data-idx="${i}"></div>
      <div class="zone-info">
        <div class="zone-name">${z.name}</div>
        <div class="zone-hex">${z.color}</div>
      </div>
      ${zones.length > 1 ? `<button class="remove-btn" data-idx="${i}">&times;</button>` : ""}
    `;

    div.addEventListener("click", (e) => {
      if (e.target.classList.contains("remove-btn")) {
        removeZone(i);
        return;
      }
      if (e.target.classList.contains("zone-swatch")) {
        pickZoneColor(i);
        return;
      }
      activeZone = i;
      renderZoneList();
    });

    // Double-click name to rename
    const nameEl = div.querySelector(".zone-name");
    nameEl.addEventListener("dblclick", (e) => {
      e.stopPropagation();
      const input = document.createElement("input");
      input.type = "text";
      input.value = z.name;
      input.style.cssText =
        "background:#0f3460;border:1px solid #1a5276;color:white;font-size:13px;padding:1px 4px;border-radius:3px;width:100%;";
      nameEl.replaceWith(input);
      input.focus();
      input.select();
      const finish = () => {
        z.name = input.value || z.name;
        renderZoneList();
      };
      input.addEventListener("blur", finish);
      input.addEventListener("keydown", (ev) => {
        if (ev.key === "Enter") input.blur();
      });
    });

    // Click hex value to edit color
    const hexEl = div.querySelector(".zone-hex");
    hexEl.addEventListener("click", (e) => {
      e.stopPropagation();
      const input = document.createElement("input");
      input.type = "text";
      input.value = z.color;
      input.style.cssText =
        "background:#0f3460;border:1px solid #1a5276;color:white;font-size:13px;padding:1px 4px;border-radius:3px;width:100%;";
      hexEl.replaceWith(input);
      input.focus();
      input.select();
      const finish = () => {
        const raw = input.value.trim();
        const hex = raw.startsWith("#") ? raw : "#" + raw;
        if (/^#[0-9a-fA-F]{6}$/.test(hex)) {
          z.color = hex.toUpperCase();
        }
        renderZoneList();
        drawCanvas();
      };
      input.addEventListener("blur", finish);
      input.addEventListener("keydown", (ev) => {
        if (ev.key === "Enter") input.blur();
        if (ev.key === "Escape") {
          input.removeEventListener("blur", finish);
          renderZoneList();
        }
      });
    });

    container.appendChild(div);
  });
}

function pickZoneColor(idx) {
  const picker = document.createElement("input");
  picker.type = "color";
  picker.value = zones[idx].color;
  picker.addEventListener("input", (e) => {
    zones[idx].color = e.target.value.toUpperCase();
    renderZoneList();
    render();
  });
  picker.click();
}

function removeZone(idx) {
  if (zones.length <= 1) return;
  const removedZoneVal = idx + 1;
  zones.splice(idx, 1);

  // Renumber mask data
  const len = maskData.length;
  for (let i = 0; i < len; i++) {
    if (maskData[i] === removedZoneVal) {
      maskData[i] = 0;
    } else if (maskData[i] > removedZoneVal) {
      maskData[i]--;
    }
  }

  if (activeZone >= zones.length) activeZone = zones.length - 1;
  renderZoneList();
  render();
}

function renderPresets() {
  const grid = document.getElementById("presetGrid");
  PRESETS.forEach((p) => {
    const div = document.createElement("div");
    div.className = "preset-swatch";
    div.style.background = p.hex;
    div.title = p.name;
    div.addEventListener("click", () => {
      zones[activeZone].color = p.hex;
      zones[activeZone].name = p.name;
      renderZoneList();
      render();
      closeSidebarIfMobile();
    });
    div.addEventListener("mouseenter", (e) => {
      if (
        "ontouchstart" in window &&
        !window.matchMedia("(hover: hover)").matches
      )
        return;
      tooltipEl.textContent = `${p.name} (${p.hex})`;
      tooltipEl.style.display = "block";
      tooltipEl.style.left = e.clientX + 12 + "px";
      tooltipEl.style.top = e.clientY - 28 + "px";
    });
    div.addEventListener("mouseleave", () => {
      tooltipEl.style.display = "none";
    });
    grid.appendChild(div);
  });
}

// ===== HINT =====
function showHint(msg) {
  hintOverlay.textContent = msg;
  hintOverlay.style.display = "block";
  setTimeout(() => {
    hintOverlay.style.display = "none";
  }, 5000);
}

// ===== BRUSH CURSOR =====
function updateBrushCursor(clientX, clientY) {
  if (viewMode !== "edit" || activeTool === "fill" || activeTool === "line") {
    brushCursor.style.display = "none";
    return;
  }
  const rect = mainCanvas.getBoundingClientRect();
  const inBounds =
    clientX >= rect.left &&
    clientX <= rect.right &&
    clientY >= rect.top &&
    clientY <= rect.bottom;
  if (!inBounds) {
    brushCursor.style.display = "none";
    return;
  }
  const displaySize = brushSize * 2;
  brushCursor.style.display = "block";
  brushCursor.style.width = displaySize + "px";
  brushCursor.style.height = displaySize + "px";
  brushCursor.style.left = clientX - displaySize / 2 + "px";
  brushCursor.style.top = clientY - displaySize / 2 + "px";
  brushCursor.style.borderRadius = brushShape === "round" ? "50%" : "0";
  const tint = ZONE_TINTS[activeZone % ZONE_TINTS.length];
  brushCursor.style.borderColor =
    activeTool === "erase"
      ? "#f87171"
      : `rgb(${tint[0]},${tint[1]},${tint[2]})`;
}

// ===== LINE TOOL PREVIEW =====
function imageToScreen(imgX, imgY) {
  const rect = mainCanvas.getBoundingClientRect();
  const containerRect = canvasContainer.getBoundingClientRect();
  return {
    x: rect.left - containerRect.left + (imgX / img.width) * rect.width,
    y: rect.top - containerRect.top + (imgY / img.height) * rect.height,
  };
}

function updateLinePreview(clientX, clientY) {
  const preview = document.getElementById("linePreview");
  const marker = document.getElementById("lineStartMarker");
  if (!lineStartImg || activeTool !== "line") {
    preview.style.display = "none";
    marker.style.display = "none";
    return;
  }
  const start = imageToScreen(lineStartImg.x, lineStartImg.y);
  const containerRect = canvasContainer.getBoundingClientRect();
  const endX = clientX - containerRect.left;
  const endY = clientY - containerRect.top;

  // Set viewBox to match container pixel size so coordinates align
  const cw = containerRect.width;
  const ch = containerRect.height;
  preview.setAttribute("viewBox", `0 0 ${cw} ${ch}`);

  const line = document.getElementById("linePreviewLine");
  line.setAttribute("x1", start.x);
  line.setAttribute("y1", start.y);
  line.setAttribute("x2", endX);
  line.setAttribute("y2", endY);

  // Match brush width and shape
  const tint = ZONE_TINTS[activeZone % ZONE_TINTS.length];
  const cap = brushShape === "round" ? "round" : "butt";
  line.style.stroke = `rgba(${tint[0]},${tint[1]},${tint[2]}, 0.4)`;
  line.style.strokeWidth = brushSize * 2;
  line.style.strokeLinecap = cap;

  preview.style.display = "block";

  marker.style.left = start.x + "px";
  marker.style.top = start.y + "px";
  marker.style.display = "block";
}

function clearLinePreview() {
  lineStartImg = null;
  document.getElementById("linePreview").style.display = "none";
  document.getElementById("lineStartMarker").style.display = "none";
}

// ===== MOBILE SIDEBAR =====
function openSidebar() {
  document.getElementById("sidebar").classList.add("open");
  document.getElementById("sidebarOverlay").classList.add("visible");
  document.getElementById("sidebarToggle").style.display = "none";
}

function closeSidebar() {
  document.getElementById("sidebar").classList.remove("open");
  document.getElementById("sidebarOverlay").classList.remove("visible");
  if (window.matchMedia("(max-width: 768px)").matches) {
    document.getElementById("sidebarToggle").style.display = "flex";
  }
}

function closeSidebarIfMobile() {
  if (window.matchMedia("(max-width: 768px)").matches) closeSidebar();
}

// ===== EVENTS =====
function setupEvents() {
  // Intensity
  document.getElementById("intensity").addEventListener("input", (e) => {
    intensity = +e.target.value;
    render();
  });

  // Blend mode
  document.getElementById("blendToggle").addEventListener("click", (e) => {
    const btn = e.target.closest(".mode-btn");
    if (!btn) return;
    document
      .querySelectorAll("#blendToggle .mode-btn")
      .forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    blendMode = btn.dataset.blend;
    render();
  });

  // View mode
  document.getElementById("viewToggle").addEventListener("click", (e) => {
    const btn = e.target.closest(".mode-btn");
    if (!btn) return;
    setView(btn.dataset.view);
  });

  // Add zone
  document.getElementById("addZoneBtn").addEventListener("click", () => {
    const colors = [
      "#CDD2CA",
      "#D1C7B8",
      "#BDD0D4",
      "#B8A992",
      "#BCC2B2",
      "#CBCCC9",
    ];
    const color = colors[zones.length % colors.length];
    zones.push({ name: `Zone ${zones.length + 1}`, color });
    activeZone = zones.length - 1;
    renderZoneList();
  });

  // Save / Load
  document.getElementById("saveMask").addEventListener("click", saveMask);
  document.getElementById("loadMask").addEventListener("click", () => {
    if (!img) return;
    const raw = localStorage.getItem("wallMaskData");
    if (!raw) {
      alert("No saved mask found.");
      return;
    }
    try {
      const data = JSON.parse(raw);
      if (data.width !== img.width || data.height !== img.height) {
        alert("Saved mask dimensions do not match.");
        return;
      }
      if (data.version === 2) {
        maskData = rlDecode(data.mask, img.width * img.height);
        if (data.zones) {
          zones = data.zones;
          activeZone = 0;
          renderZoneList();
        }
      }
      undoStack = [];
      redoStack = [];
      updateUndoButtons();
      render();
      const btn = document.getElementById("loadMask");
      btn.textContent = "Loaded!";
      setTimeout(() => {
        btn.textContent = "Load";
      }, 1500);
    } catch {
      alert("Failed to load mask.");
    }
  });

  // Export / Import
  document.getElementById("exportMask").addEventListener("click", exportMask);
  document.getElementById("importMask").addEventListener("click", importMask);

  // Load Image (sidebar)
  document.getElementById("loadImageBtn").addEventListener("click", () => {
    openFilePicker("image/*", loadImageFromFile);
  });

  // Tools
  document
    .getElementById("toolBrush")
    .addEventListener("click", () => setTool("brush"));
  document
    .getElementById("toolErase")
    .addEventListener("click", () => setTool("erase"));
  document
    .getElementById("toolLine")
    .addEventListener("click", () => setTool("line"));
  document
    .getElementById("toolFill")
    .addEventListener("click", () => setTool("fill"));
  document.getElementById("brushSize").addEventListener("input", (e) => {
    brushSize = +e.target.value;
  });
  document.getElementById("brushShapeBtn").addEventListener("click", () => {
    brushShape = brushShape === "round" ? "square" : "round";
    document.getElementById("brushShapeBtn").innerHTML =
      brushShape === "round" ? "&#9679;" : "&#9632;";
    document.getElementById("brushShapeBtn").title =
      brushShape === "round"
        ? "Switch to square brush"
        : "Switch to round brush";
  });
  document.getElementById("fillTolerance").addEventListener("input", (e) => {
    fillTolerance = +e.target.value;
  });
  document.getElementById("undoBtn").addEventListener("click", undo);
  document.getElementById("redoBtn").addEventListener("click", redo);

  document.getElementById("autoDetect").addEventListener("click", () => {
    autoDetectWalls(activeZone);
  });

  document.getElementById("resetMask").addEventListener("click", () => {
    beginStroke();
    for (let i = 0; i < maskData.length; i++) {
      recordPixel(i, maskData[i]);
      maskData[i] = 0;
    }
    endStroke();
    render();
  });

  // Zoom
  document.getElementById("zoomFit").addEventListener("click", resetZoom);

  canvasContainer.addEventListener(
    "wheel",
    (e) => {
      e.preventDefault();
      const factor = e.deltaY < 0 ? 1.12 : 0.89;
      const rect = canvasContainer.getBoundingClientRect();
      zoomAtPoint(factor, e.clientX - rect.left, e.clientY - rect.top);
    },
    { passive: false },
  );

  // --- Mouse events ---
  mainCanvas.addEventListener("mousedown", (e) => {
    if (e.button === 1 || (e.button === 0 && spaceHeld)) {
      // Middle click or Space+left click: pan
      isPanning = true;
      panStartX = e.clientX;
      panStartY = e.clientY;
      panStartPanX = panX;
      panStartPanY = panY;
      e.preventDefault();
      return;
    }
    if (viewMode !== "edit") return;
    if (e.button !== 0) return;

    if (activeTool === "fill") {
      const { x, y } = getImageCoords(e.clientX, e.clientY);
      floodFill(x, y);
      hintOverlay.style.display = "none";
      e.preventDefault();
      return;
    }

    if (activeTool === "line") {
      const { x, y } = getImageCoords(e.clientX, e.clientY);
      if (!lineStartImg) {
        lineStartImg = { x, y };
        updateLinePreview(e.clientX, e.clientY);
      } else {
        beginStroke();
        paintLine(lineStartImg.x, lineStartImg.y, x, y);
        endStroke();
        lineStartImg = { x, y }; // chain: end becomes new start
        updateLinePreview(e.clientX, e.clientY);
      }
      hintOverlay.style.display = "none";
      e.preventDefault();
      return;
    }

    // Brush / erase
    isPainting = true;
    beginStroke();
    const { x, y } = getImageCoords(e.clientX, e.clientY);
    paintAt(x, y);
    render();
    lastPaintX = x;
    lastPaintY = y;
    hintOverlay.style.display = "none";
    e.preventDefault();
  });

  window.addEventListener("mousemove", (e) => {
    if (isPanning) {
      panX = panStartPanX + (e.clientX - panStartX);
      panY = panStartPanY + (e.clientY - panStartY);
      canvasContainer.style.cursor = "grabbing";
      updateCanvasTransform();
      return;
    }
    if (draggingSlider) {
      const rect = mainCanvas.getBoundingClientRect();
      compareSplit = Math.max(
        0.02,
        Math.min(0.98, (e.clientX - rect.left) / rect.width),
      );
      updateCompareClip();
    }
    if (isPainting && viewMode === "edit") {
      const { x, y } = getImageCoords(e.clientX, e.clientY);
      if (lastPaintX >= 0) paintLine(lastPaintX, lastPaintY, x, y);
      lastPaintX = x;
      lastPaintY = y;
    }
    if (draggingResize) {
      const newWidth = Math.max(
        180,
        Math.min(window.innerWidth * 0.5, e.clientX),
      );
      document.getElementById("sidebar").style.width = newWidth + "px";
    }
    updateBrushCursor(e.clientX, e.clientY);
    if (activeTool === "line" && lineStartImg)
      updateLinePreview(e.clientX, e.clientY);
  });

  window.addEventListener("mouseup", () => {
    if (isPanning) {
      isPanning = false;
      canvasContainer.style.cursor = spaceHeld ? "grab" : "";
      return;
    }
    if (isPainting) {
      isPainting = false;
      lastPaintX = -1;
      lastPaintY = -1;
      endStroke();
    }
    draggingSlider = false;
    if (draggingResize) {
      draggingResize = false;
      resizeHandle.classList.remove("active");
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    }
  });

  // Compare slider
  const slider = document.getElementById("compareSlider");
  slider.addEventListener("mousedown", (e) => {
    draggingSlider = true;
    e.preventDefault();
  });
  slider.addEventListener(
    "touchstart",
    (e) => {
      draggingSlider = true;
      e.preventDefault();
    },
    { passive: false },
  );

  window.addEventListener(
    "touchmove",
    (e) => {
      if (draggingSlider && e.touches.length === 1) {
        const rect = mainCanvas.getBoundingClientRect();
        compareSplit = Math.max(
          0.02,
          Math.min(0.98, (e.touches[0].clientX - rect.left) / rect.width),
        );
        updateCompareClip();
        e.preventDefault();
      }
    },
    { passive: false },
  );

  window.addEventListener("touchend", () => {
    if (draggingSlider) draggingSlider = false;
  });

  // Sidebar resize
  const resizeHandle = document.getElementById("resizeHandle");
  let draggingResize = false;
  resizeHandle.addEventListener("mousedown", (e) => {
    draggingResize = true;
    resizeHandle.classList.add("active");
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    e.preventDefault();
  });

  // --- Touch events for canvas ---
  mainCanvas.addEventListener(
    "touchstart",
    (e) => {
      if (e.touches.length === 2) {
        // Pinch start
        if (isPainting) {
          isPainting = false;
          lastPaintX = -1;
          lastPaintY = -1;
          endStroke();
        }
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        lastPinchDist = Math.sqrt(dx * dx + dy * dy);
        lastPinchCenter = {
          x: (e.touches[0].clientX + e.touches[1].clientX) / 2,
          y: (e.touches[0].clientY + e.touches[1].clientY) / 2,
        };
        wasPinching = true;
        e.preventDefault();
        return;
      }

      if (e.touches.length === 1 && viewMode === "edit") {
        wasPinching = false;

        if (activeTool === "fill") {
          const { x, y } = getImageCoords(
            e.touches[0].clientX,
            e.touches[0].clientY,
          );
          floodFill(x, y);
          hintOverlay.style.display = "none";
          e.preventDefault();
          return;
        }

        if (activeTool === "line") {
          const { x, y } = getImageCoords(
            e.touches[0].clientX,
            e.touches[0].clientY,
          );
          if (!lineStartImg) {
            lineStartImg = { x, y };
            updateLinePreview(e.touches[0].clientX, e.touches[0].clientY);
          } else {
            beginStroke();
            paintLine(lineStartImg.x, lineStartImg.y, x, y);
            endStroke();
            lineStartImg = { x, y };
            updateLinePreview(e.touches[0].clientX, e.touches[0].clientY);
          }
          hintOverlay.style.display = "none";
          e.preventDefault();
          return;
        }

        isPainting = true;
        beginStroke();
        const { x, y } = getImageCoords(
          e.touches[0].clientX,
          e.touches[0].clientY,
        );
        paintAt(x, y);
        render();
        lastPaintX = x;
        lastPaintY = y;
        hintOverlay.style.display = "none";
        e.preventDefault();
      }
    },
    { passive: false },
  );

  mainCanvas.addEventListener(
    "touchmove",
    (e) => {
      if (e.touches.length === 2) {
        // Pinch zoom / pan
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const center = {
          x: (e.touches[0].clientX + e.touches[1].clientX) / 2,
          y: (e.touches[0].clientY + e.touches[1].clientY) / 2,
        };

        if (lastPinchDist > 0) {
          // Pan
          panX += center.x - lastPinchCenter.x;
          panY += center.y - lastPinchCenter.y;

          // Zoom
          const scale = dist / lastPinchDist;
          const rect = canvasContainer.getBoundingClientRect();
          const cx = center.x - rect.left;
          const cy = center.y - rect.top;
          zoomAtPoint(scale, cx, cy);
        }

        lastPinchDist = dist;
        lastPinchCenter = center;
        e.preventDefault();
        return;
      }

      if (
        isPainting &&
        viewMode === "edit" &&
        e.touches.length === 1 &&
        !wasPinching
      ) {
        const { x, y } = getImageCoords(
          e.touches[0].clientX,
          e.touches[0].clientY,
        );
        if (lastPaintX >= 0) paintLine(lastPaintX, lastPaintY, x, y);
        lastPaintX = x;
        lastPaintY = y;
        e.preventDefault();
      }
    },
    { passive: false },
  );

  mainCanvas.addEventListener("touchend", (e) => {
    if (e.touches.length < 2) {
      lastPinchDist = 0;
      lastPinchCenter = null;
    }
    if (e.touches.length === 0) {
      if (isPainting) {
        isPainting = false;
        lastPaintX = -1;
        lastPaintY = -1;
        endStroke();
      }
      wasPinching = false;
    }
  });

  // Mobile sidebar
  document
    .getElementById("sidebarToggle")
    .addEventListener("click", openSidebar);
  document
    .getElementById("sidebarOverlay")
    .addEventListener("click", closeSidebar);

  // Keyboard shortcuts
  document.addEventListener("keydown", (e) => {
    if (e.target.tagName === "INPUT") return;

    if (e.key === " " && !e.repeat) {
      e.preventDefault();
      spaceHeld = true;
      canvasContainer.style.cursor = "grab";
      return;
    }

    if ((e.metaKey || e.ctrlKey) && e.key === "z" && !e.shiftKey) {
      e.preventDefault();
      undo();
      return;
    }
    if (
      (e.metaKey || e.ctrlKey) &&
      (e.key === "y" || (e.key === "z" && e.shiftKey))
    ) {
      e.preventDefault();
      redo();
      return;
    }

    if (e.key === "1") setView("edit");
    if (e.key === "2") setView("preview");
    if (e.key === "3") setView("compare");
    if (e.key === "b" || e.key === "B") setTool("brush");
    if (e.key === "e" || e.key === "E") setTool("erase");
    if (e.key === "l" || e.key === "L") setTool("line");
    if (e.key === "g" || e.key === "G") setTool("fill");
    if (e.key === "Escape") clearLinePreview();
    if (e.key === "0") resetZoom();

    if (e.key === "[") {
      brushSize = Math.max(3, brushSize - 10);
      document.getElementById("brushSize").value = brushSize;
    }
    if (e.key === "]") {
      brushSize = Math.min(200, brushSize + 10);
      document.getElementById("brushSize").value = brushSize;
    }

    // Switch active zone with Tab
    if (e.key === "Tab" && !e.ctrlKey && !e.metaKey) {
      e.preventDefault();
      activeZone = (activeZone + 1) % zones.length;
      renderZoneList();
    }
  });

  document.addEventListener("keyup", (e) => {
    if (e.key === " ") {
      spaceHeld = false;
      if (isPanning) {
        isPanning = false;
      }
      canvasContainer.style.cursor = "";
    }
  });

  // Window resize
  window.addEventListener("resize", () => {
    if (img) resetZoom();
  });
}

function setView(mode) {
  viewMode = mode;
  document.querySelectorAll("#viewToggle .mode-btn").forEach((b) => {
    b.classList.toggle("active", b.dataset.view === mode);
  });
  if (mode !== "edit") brushCursor.style.display = "none";
  render();
}

function setTool(tool) {
  activeTool = tool;
  clearLinePreview();
  document.getElementById("toolBrush").className =
    "tool-btn" + (tool === "brush" ? " active" : "");
  document.getElementById("toolErase").className =
    "tool-btn" + (tool === "erase" ? " erase-active" : "");
  document.getElementById("toolLine").className =
    "tool-btn" + (tool === "line" ? " active" : "");
  document.getElementById("toolFill").className =
    "tool-btn" + (tool === "fill" ? " active" : "");

  // Show/hide tolerance slider
  const show = tool === "fill";
  document.getElementById("tolSep").style.display = show ? "" : "none";
  document.getElementById("tolLabel").style.display = show ? "" : "none";
  document.getElementById("fillTolerance").style.display = show ? "" : "none";

  if (tool === "fill" || tool === "line") brushCursor.style.display = "none";
}

init();
