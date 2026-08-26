export default async function handler(req, res) {
  const token = process.env.CIRCLE_API_TOKEN;
  const communityId = "527745";

  res.setHeader("Access-Control-Allow-Origin", "*");

  try {
    const group = req.query.group;
    const email = req.query.email;

    if (!group) {
      return res.status(400).json({
        error: "Missing ?group= parameter"
      });
    }

    if (!email) {
      return res.status(400).json({
        error: "Missing ?email= parameter"
      });
    }

    const memberSpacesResponse = await fetch(
      `https://app.circle.so/api/v1/community_member_spaces?user_email=${encodeURIComponent(email)}`,
      {
        headers: {
          Authorization: `Token ${token}`
        }
      }
    );

    if (!memberSpacesResponse.ok) {
      throw new Error(
        `Circle member spaces API returned ${memberSpacesResponse.status}`
      );
    }

    const memberSpacesData = await memberSpacesResponse.json();
    const memberSpaces = memberSpacesData.records || [];

    const filtered = memberSpaces
      .filter(space => space.space_group_name === group)
      .map(space => ({
        id: space.id,
        name: space.name,
        url: space.url,
        type: space.space_type,
        emoji: space.emoji,
        private: space.is_private
      }));

    res.status(200).json(filtered);

  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
}
