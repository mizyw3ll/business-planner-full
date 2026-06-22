import { memo } from "react";
import { List } from "react-window";

interface OptimizedListProps<T = unknown> {
  items: T[];
  itemHeight?: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  height?: number;
  overscanCount?: number;
}

const RowComponent = memo(function RowComponent({
  index,
  renderItem,
  items,
}: {
  index: number;
  renderItem: (item: unknown, index: number) => React.ReactNode;
  items: unknown[];
}) {
  return <div>{renderItem(items[index], index)}</div>;
});

export const OptimizedList = memo(function OptimizedList<T = unknown>({
  items,
  itemHeight = 80,
  renderItem,
  height = 600,
  overscanCount = 5,
}: OptimizedListProps<T>) {
  if (items.length <= 20) {
    return (
      <div className="space-y-2">
        {items.map((item, index) => (
          <div key={index}>
            {renderItem(item, index)}
          </div>
        ))}
      </div>
    );
  }

  return (
    <List
      rowCount={items.length}
      rowHeight={itemHeight}
      defaultHeight={height}
      overscanCount={overscanCount}
      rowComponent={RowComponent}
      rowProps={{ renderItem, items }}
    />
  );
});
