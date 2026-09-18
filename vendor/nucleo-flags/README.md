# nucleo-flags

A collection of 32px React SVG flag icons from [Nucleo](https://nucleoapp.com/).

> ✨ **New:** add Nucleo icons to your React projects with our new [AI Integration](https://nucleoapp.com/ai-integration).

## Installation

```bash
npm install nucleo-flags
```

## Usage

```jsx
import { IconName } from 'nucleo-flags';

function MyComponent() {
  return <IconName />;
}
```

Browse the full list of available icons on the [Nucleo Web App](https://nucleoapp.com/app/?library=flags).

## Customization
You can customise the icon size by passing the size prop to the icon component.

```jsx
import { IconName } from 'nucleo-flags';

function MyComponent() {
  return <IconName size={24} />;
}
```

Alternatively, use CSS utility classes. For example, when using Tailwind CSS:

```jsx
<IconName className="size-[24px]" />
```

## Accessibility

To improve accessibility, you can either add a title attribute to the icon or use the aria-label attribute.

```jsx
<IconName title="Icon Name" />
```

or

```jsx
<IconName aria-label="Icon Name" />
```

If you want to hide the icon from screen readers, you can use the aria-hidden attribute.

```jsx
<IconName aria-hidden="true" />
```

## License

[nucleoapp.com/license](https://nucleoapp.com/license)
