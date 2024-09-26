import Image from 'next/image'
import classes from './Card.module.css'
import { GameObject } from '@repo/dionis-api/src/model'

type CardProps = Pick<GameObject, 'title' | 'rating' | 'price' | 'platform'> & {
  onClick?: () => void
  imageSrc: string
}

export const Card = ({ title, rating, price, onClick, platform, imageSrc }: CardProps) => {
  const [isImageLoading, setImageLoading] = useState(true)
  const containerStyles = clsx(classes.card)
  const contentStyles = clsx(classes.content)
  const contentWrapperStyles = clsx(classes.contentWrapper)
  const priceContainerStyles = clsx(classes.priceContainer)
  const titleContainerStyles = clsx(classes.titleContainer)
  const ratingStyles = clsx(classes.rating)

  const onClickHandler = () => {
    onClick && onClick()
  }

  return (
    <div className={classes.card} onClick={onClickHandler} data-testid="card">
      <Image
        priority={true}
        style={{
          borderTopLeftRadius: '1.2em',
          borderTopRightRadius: '1.2em',
          width: 'auto',
          height: 'auto',
        }}
        width={500}
        height={270}
        alt={`${title} thumbnail`}
        src={imageSrc}
        data-testid="image"
      />
      <div className={contentStyles}>
        <div className={contentWrapperStyles}>
          <div className={titleContainerStyles}>
            <h3>{title}</h3>
            <span>{platform}</span>
          </div>
          <div className={priceContainerStyles}>
            <span className={ratingStyles}>{rating}</span>
            <div>
              <span>€{price}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
