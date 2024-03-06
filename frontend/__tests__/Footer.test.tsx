import { render, screen, within } from '@testing-library/react';
import { Footer } from '@/app/_rootElements/Footer';

describe('Footer', () => {
  it('has contentinfo role', () => {
    render(<Footer />);
    expect(screen.getByRole('contentinfo')).toBeDefined();
  });

  it('contains copyright notice', () => {
    render(<Footer />);
    expect(screen.getByText(/.*\u00a9.*/)).toBeDefined();
  });

  it('contains social media icons in a grid', () => {
    render(<Footer />);
    const socialmediaIconGrid = screen.getByLabelText('Social Media Links');
    expect(socialmediaIconGrid).toHaveAttribute('role', 'grid');
  });

  it('contains social media icons with links', () => {
    render(<Footer />);
    const socialmediadiv = screen.getByLabelText('Social Media Links');
    expect(within(socialmediadiv).getAllByRole('link')).toHaveLength(5);
    // const elems = Array.from(socialmediadiv.children) as HTMLElement[]
    // const linkMatcher = /<a .*href=".*".*>.*<\/a>/
    // const isLink = (elem: HTMLElement): boolean =>
    //   elem.outerHTML.match(linkMatcher) !== null
    // expect(elems.map((elem) => isLink(elem)).every(Boolean)).toBeTruthy()
  });

  it('contains a contact link', () => {
    render(<Footer />);
    const contactElem = screen.getByText(/Contact Us:.*/);
    expect(contactElem).toBeDefined();
    const containsMailToLink = contactElem.outerHTML.match(
      'mailto:contact@glasummit.org'
    );
    expect(containsMailToLink).toBeTruthy();
  });
});
