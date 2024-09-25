import { fireEvent, render } from "@/test-utils"
import { Card, CardProps } from "@/ui"

const game: CardProps = {
  title: 'Kings',
  price: 55,
  rating: '5',
  imageSrc: 'https://www.freetogame.com/g/540/thumbnail.jpg',
  platform: 'PC'
}

describe('<Card />', () => {
  test('Should render Card with correct data', () => {
    const { getByText } = render(
      <Card 
        title={game.title}
        price={game.price}
        rating={game.rating}
        platform={game.platform}
        imageSrc={game.imageSrc}
      />
    )

    const title = getByText(game.title)
    const price = getByText('€' + game.price)
    const rating = getByText(game.rating)
    const platform = getByText(game.platform)

    expect(title).toBeInTheDocument()
    expect(price).toBeInTheDocument()
    expect(rating).toBeInTheDocument()
    expect(platform).toBeInTheDocument()
  })

  test('Should trigger a click on Card', () => {
    const mockFn = jest.fn()
    const { getByTestId } = render(
      <Card 
        title={game.title}
        price={game.price}
        rating={game.rating}
        platform={game.platform}
        imageSrc={game.imageSrc}
        onClick={mockFn}
      />
    )
    const card = getByTestId('card')

    fireEvent.click(card)

    expect(mockFn).toHaveBeenCalled()
  })

  test('Should render correct image', () => {
    const { getByAltText } = render(
      <Card 
        title={game.title}
        price={game.price}
        rating={game.rating}
        platform={game.platform}
        imageSrc={game.imageSrc}
      />
    )

    const image = getByAltText(game.title + ' thumbnail');
  
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('src');
  })
})