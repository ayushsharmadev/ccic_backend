import State from "@/lib/models/State";
import District from "@/lib/models/District";

export function applyDirectLocationFilters(filter, { country, state, district }) {
  if (country) filter.country = country;
  if (state) filter.state = state;
  if (district) filter.district = district;
  return filter;
}

export async function applyCityDistrictFilter(
  filter,
  { city, country, state, district }
) {
  if (district || !city) return filter;

  const districtQuery = {
    name: { $regex: city, $options: "i" },
    status: "active",
  };

  if (state) {
    districtQuery.state = state;
  } else if (country) {
    const states = await State.find({ country, status: "active" })
      .select("_id")
      .lean();
    districtQuery.state = { $in: states.map((item) => item._id) };
  }

  const districts = await District.find(districtQuery).select("_id").lean();
  filter.district = districts.length
    ? { $in: districts.map((item) => item._id) }
    : { $in: [] };

  return filter;
}

export async function buildStateScopeFilter({ country, status = "active" }) {
  const filter = { status };
  if (country) filter.country = country;
  return filter;
}

export async function buildDistrictScopeFilter({
  country,
  state,
  status = "active",
}) {
  const filter = { status };

  if (state) {
    filter.state = state;
  } else if (country) {
    const states = await State.find({ country, status: "active" })
      .select("_id")
      .lean();
    filter.state = { $in: states.map((item) => item._id) };
  }

  return filter;
}

export function transformCountryRef(country) {
  if (!country) return null;
  return {
    id: country._id,
    name: country.name,
    code: country.code,
  };
}
