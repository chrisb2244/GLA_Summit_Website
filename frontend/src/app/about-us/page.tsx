import Link from 'next/link';

const AboutUsPage = () => {
  return (
    <div className='prose max-w-none pt-4'>
      <h2>About Us</h2>
      <p>
        Welcome to the GLA Summit page, where our mission is to cultivate an
        inclusive global community of graphical programmers dedicated to making
        a positive impact on the world. Through our initiatives, we aim to
        support the professional growth of individuals, foster sharing of
        practical knowledge, and celebrate G-language excellence.
      </p>
      <Link href='/our-team' className='link'>
        Meet our Team
      </Link>
      <h3>Our Mission</h3>
      <p>
        At GLA, we believe in the power of collaboration and knowledge-sharing
        to drive positive change. Our mission is threefold:
      </p>
      <ul>
        <li>
          Supporting Professional Growth: We provide resources and opportunities
          for graphical programmers to enhance their skills and advance in their
          careers.
        </li>
        <li>
          Sharing Practical Knowledge: Through our events, we facilitate the
          exchange of practical insights and best practices within the graphical
          programming community.
        </li>
        <li>
          Showcasing Good G-Language Craft: We recognize and celebrate
          excellence in G-language programming, inspiring others to strive for
          quality and innovation.
        </li>
      </ul>
      <h3>Our Vision</h3>
      <p>
        Our vision is to establish and nurture an independent platform for
        G-language developers worldwide. This platform, known as GLA Summit,
        serves as a hub for sharing expertise, fostering collaboration, and
        growing professional networks within the G-language community. Through
        GLA Summit, we aim to:
      </p>
      <ul>
        <li>
          Provide a space for G-language developers to share their expertise,
          craft, and knowledge.
        </li>
        <li>
          Facilitate connections and collaboration opportunities to strengthen
          the G-language community as a whole.
        </li>
        <li>
          Continuously evolve and expand our offerings to meet the evolving
          needs of our members and the industry.
        </li>
      </ul>
      <h3>GLA Summit</h3>
      <p>
        As a global online conference, GLA Summit features a diverse range of
        presentations, panel discussions, and invited talks by community
        members. Whether you&apos;re interested in technical presentations or
        engaging panel discussions on current topics, GLA Summit offers
        something for everyone.
      </p>
      <h3>Our Values</h3>
      <p>At GLA, our values guide everything we do. We are committed to:</p>
      <ul>
        <li>
          Openness/Transparency: We believe in being transparent and inclusive
          in our operations and decision-making processes.
        </li>
        <li>
          Inclusion: We strive to create an environment where all members feel
          welcome, respected, and valued.
        </li>
        <li>
          Human-Centered Development: We prioritize the well-being and growth of
          our community members, placing human needs and experiences at the
          forefront of our planning.
        </li>
        <li>
          Reduced Carbon Impact: An online, global summit allows attendees to
          experience the knowledge-sharing of a conference without the
          environmental impact of international travel.
        </li>
      </ul>
    </div>
  );
};

export default AboutUsPage;
