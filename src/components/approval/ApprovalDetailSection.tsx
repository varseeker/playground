import React, { memo, useMemo } from 'react';
import { Card, Col, Divider, Empty, Row, Skeleton, Table, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import ComparisonTableApproval from './ComparisonTableApproval';

const { Text } = Typography;

type PrimitiveValue = string | number | boolean;
type GenericObject = Record<string, unknown>;
type StringKeyOf<T> = Extract<keyof T, string>;

export interface ApprovalDetailSectionProps<T extends GenericObject> {
  data: T;
  loading?: boolean;
}

interface PrimitiveField {
  key: string;
  label: string;
  value: PrimitiveValue;
}

interface TableSection {
  sectionType: 'table';
  key: string;
  title: string;
  rows: GenericObject[];
  columns: ColumnsType<GenericObject>;
}

interface ComparisonSection {
  sectionType: 'comparison';
  key: string;
  title: string;
  oldKey: string;
  newKey: string;
  dataOld: GenericObject[];
  dataNew: GenericObject[];
}

type ListSection = TableSection | ComparisonSection;

interface ParsedSections {
  primitiveFields: PrimitiveField[];
  listSections: ListSection[];
}

const EMPTY_VALUE_PLACEHOLDER = '-';
const sectionContainerStyle: React.CSSProperties = {
  border: '1px solid #f0f0f0',
  borderRadius: 8,
  padding: 12,
  height: '100%',
};
const sectionTitleStyle: React.CSSProperties = {
  display: 'block',
  marginBottom: 12,
};

export function isPrimitive(value: unknown): value is PrimitiveValue {
  return typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean';
}

export function isArrayOfObject(value: unknown): value is GenericObject[] {
  if (!Array.isArray(value)) {
    return false;
  }

  return value.every((item) => typeof item === 'object' && item !== null && !Array.isArray(item));
}

export function formatLabel(key: string): string {
  const normalized = key
    .replace(/[._-]+/g, ' ')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/([A-Z])([A-Z][a-z])/g, '$1 $2')
    .trim()
    .replace(/\s+/g, ' ');

  return normalized.replace(/\b\w/g, (char) => char.toUpperCase());
}

function renderUnknownValue(value: unknown): React.ReactNode {
  if (value === null || value === undefined || value === '') {
    return EMPTY_VALUE_PLACEHOLDER;
  }

  if (typeof value === 'boolean') {
    return value ? 'True' : 'False';
  }

  if (typeof value === 'number' || typeof value === 'string') {
    return String(value);
  }

  return JSON.stringify(value);
}

function renderPrimitiveValue(value: PrimitiveValue): React.ReactNode {
  if (typeof value === 'boolean') {
    return value ? 'True' : 'False';
  }

  if (value === '') {
    return EMPTY_VALUE_PLACEHOLDER;
  }

  return String(value);
}

export function generateColumns<T extends GenericObject>(data: T[]): ColumnsType<T> {
  const firstRow = data[0];

  if (!firstRow) {
    return [];
  }

  const keys = Object.keys(firstRow) as Array<StringKeyOf<T>>;

  return keys.map((key): ColumnsType<T>[number] => ({
    title: formatLabel(key),
    dataIndex: key,
    key,
    render: (value: unknown) => renderUnknownValue(value),
  }));
}

function isObjectRecord(value: unknown): value is GenericObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function hasSuffix(value: string, suffix: 'Old' | 'New'): boolean {
  return value.endsWith(suffix) && value.length > suffix.length;
}

function removeSuffix(value: string, suffix: 'Old' | 'New'): string {
  return value.slice(0, value.length - suffix.length);
}

interface PairMatch<T> {
  baseKey: string;
  oldKey: string;
  newKey: string;
  oldValue: T;
  newValue: T;
}

function getPairedValues<T>(
  key: string,
  sourceMap: Map<string, unknown>,
  guard: (value: unknown) => value is T,
): PairMatch<T> | null {
  if (hasSuffix(key, 'Old')) {
    const baseKey = removeSuffix(key, 'Old');
    const oldValue = sourceMap.get(key);
    const newKey = `${baseKey}New`;
    const newValue = sourceMap.get(newKey);

    if (guard(oldValue) && guard(newValue)) {
      return {
        baseKey,
        oldKey: key,
        newKey,
        oldValue,
        newValue,
      };
    }
  }

  if (hasSuffix(key, 'New')) {
    const baseKey = removeSuffix(key, 'New');
    const oldKey = `${baseKey}Old`;
    const oldValue = sourceMap.get(oldKey);
    const newValue = sourceMap.get(key);

    if (guard(oldValue) && guard(newValue)) {
      return {
        baseKey,
        oldKey,
        newKey: key,
        oldValue,
        newValue,
      };
    }
  }

  return null;
}

function pushPrimitiveField(
  primitiveFields: PrimitiveField[],
  fieldKey: string,
  label: string,
  value: PrimitiveValue,
): void {
  primitiveFields.push({
    key: fieldKey,
    label,
    value,
  });
}

function pushTableSection(
  listSections: ListSection[],
  sectionKey: string,
  title: string,
  rows: GenericObject[],
): void {
  listSections.push({
    sectionType: 'table',
    key: `table-${sectionKey}`,
    title,
    rows,
    columns: generateColumns(rows),
  });
}

function pushComparisonSection(
  listSections: ListSection[],
  sectionKey: string,
  title: string,
  oldKey: string,
  newKey: string,
  dataOld: GenericObject[],
  dataNew: GenericObject[],
): void {
  listSections.push({
    sectionType: 'comparison',
    key: `comparison-${sectionKey}`,
    title,
    oldKey,
    newKey,
    dataOld,
    dataNew,
  });
}

function collectSingleObjectSections(
  objectPath: string,
  objectValue: GenericObject,
  primitiveFields: PrimitiveField[],
  listSections: ListSection[],
  depth = 0,
): void {
  if (depth > 4) {
    return;
  }

  (Object.entries(objectValue) as Array<[string, unknown]>).forEach(([subKey, subValue]) => {
    const pathKey = `${objectPath}.${subKey}`;

    if (isPrimitive(subValue)) {
      pushPrimitiveField(primitiveFields, pathKey, formatLabel(subKey), subValue);
      return;
    }

    if (isArrayOfObject(subValue)) {
      pushTableSection(listSections, pathKey, formatLabel(subKey), subValue);
      return;
    }

    if (isObjectRecord(subValue)) {
      collectSingleObjectSections(pathKey, subValue, primitiveFields, listSections, depth + 1);
    }
  });
}

function collectPairedObjectSections(
  basePath: string,
  oldObject: GenericObject,
  newObject: GenericObject,
  displayOldKey: string,
  displayNewKey: string,
  primitiveFields: PrimitiveField[],
  listSections: ListSection[],
  depth = 0,
): void {
  if (depth > 4) {
    return;
  }

  const orderedKeys = [
    ...Object.keys(newObject),
    ...Object.keys(oldObject).filter((key) => !(key in newObject)),
  ];

  orderedKeys.forEach((subKey) => {
    const pathKey = `${basePath}.${subKey}`;
    const oldValue = oldObject[subKey];
    const newValue = newObject[subKey];

    if (isPrimitive(newValue)) {
      pushPrimitiveField(primitiveFields, pathKey, formatLabel(subKey), newValue);
      return;
    }

    if (newValue === undefined && isPrimitive(oldValue)) {
      pushPrimitiveField(primitiveFields, pathKey, formatLabel(subKey), oldValue);
      return;
    }

    const oldArray = isArrayOfObject(oldValue) ? oldValue : null;
    const newArray = isArrayOfObject(newValue) ? newValue : null;

    if (oldArray || newArray) {
      if (oldArray && newArray) {
        pushComparisonSection(
          listSections,
          pathKey,
          formatLabel(subKey),
          displayOldKey,
          displayNewKey,
          oldArray,
          newArray,
        );
        return;
      }

      pushTableSection(listSections, pathKey, formatLabel(subKey), newArray ?? oldArray ?? []);
      return;
    }

    const oldNestedObject = isObjectRecord(oldValue) ? oldValue : {};
    const newNestedObject = isObjectRecord(newValue) ? newValue : {};

    if (Object.keys(oldNestedObject).length > 0 || Object.keys(newNestedObject).length > 0) {
      collectPairedObjectSections(
        pathKey,
        oldNestedObject,
        newNestedObject,
        displayOldKey,
        displayNewKey,
        primitiveFields,
        listSections,
        depth + 1,
      );
    }
  });
}

function buildSections(data: GenericObject): ParsedSections {
  const primitiveFields: PrimitiveField[] = [];
  const listSections: ListSection[] = [];
  const entries = Object.entries(data) as Array<[string, unknown]>;
  const sourceMap = new Map<string, unknown>(entries);
  const processedRootKeys = new Set<string>();

  entries.forEach(([key, value]) => {
    if (processedRootKeys.has(key) || value === null || value === undefined) {
      return;
    }

    if (isPrimitive(value)) {
      pushPrimitiveField(primitiveFields, key, formatLabel(key), value);
      processedRootKeys.add(key);
      return;
    }

    if (isArrayOfObject(value)) {
      const rootArrayPair = getPairedValues<GenericObject[]>(key, sourceMap, isArrayOfObject);
      if (
        rootArrayPair &&
        !processedRootKeys.has(rootArrayPair.oldKey) &&
        !processedRootKeys.has(rootArrayPair.newKey)
      ) {
        const comparisonBase = rootArrayPair.baseKey || key;
        pushComparisonSection(
          listSections,
          comparisonBase,
          formatLabel(comparisonBase),
          rootArrayPair.oldKey,
          rootArrayPair.newKey,
          rootArrayPair.oldValue,
          rootArrayPair.newValue,
        );
        processedRootKeys.add(rootArrayPair.oldKey);
        processedRootKeys.add(rootArrayPair.newKey);
        return;
      }

      pushTableSection(listSections, key, formatLabel(key), value);
      processedRootKeys.add(key);
      return;
    }

    if (isObjectRecord(value)) {
      const rootObjectPair = getPairedValues<GenericObject>(key, sourceMap, isObjectRecord);
      if (
        rootObjectPair &&
        !processedRootKeys.has(rootObjectPair.oldKey) &&
        !processedRootKeys.has(rootObjectPair.newKey)
      ) {
        const objectBase = rootObjectPair.baseKey || key;
        collectPairedObjectSections(
          objectBase,
          rootObjectPair.oldValue,
          rootObjectPair.newValue,
          rootObjectPair.oldKey,
          rootObjectPair.newKey,
          primitiveFields,
          listSections,
        );
        processedRootKeys.add(rootObjectPair.oldKey);
        processedRootKeys.add(rootObjectPair.newKey);
        return;
      }

      collectSingleObjectSections(key, value, primitiveFields, listSections);
      processedRootKeys.add(key);
    }
  });

  return {
    primitiveFields,
    listSections,
  };
}

function ApprovalDetailSectionComponent<T extends GenericObject>({
  data,
  loading = false,
}: ApprovalDetailSectionProps<T>): JSX.Element {
  const { primitiveFields, listSections } = useMemo(() => buildSections(data), [data]);
  const hasContent = primitiveFields.length > 0 || listSections.length > 0;

  if (loading && !hasContent) {
    return (
      <Card size="small">
        <Skeleton active paragraph={{ rows: 4 }} />
      </Card>
    );
  }

  if (!hasContent) {
    return (
      <Card size="small">
        <Empty description="No approval detail data available" />
      </Card>
    );
  }

  return (
    <Card size="small" styles={{ body: { padding: 16 } }}>
      {primitiveFields.length > 0 && (
        <Row gutter={[16, 12]}>
          {primitiveFields.map((field) => (
            <Col key={field.key} xs={24} md={12}>
              <Text strong>{field.label}</Text>
              <Text>{`: ${renderPrimitiveValue(field.value)}`}</Text>
            </Col>
          ))}
        </Row>
      )}

      {primitiveFields.length > 0 && listSections.length > 0 && <Divider style={{ margin: '16px 0' }} />}

      {listSections.length > 0 && (
        <Row gutter={[16, 16]}>
          {listSections.map((section) => (
            <Col key={section.key} xs={24} md={12}>
              <div style={sectionContainerStyle}>
                <Text strong style={sectionTitleStyle}>
                  {section.title}
                </Text>

                {section.sectionType === 'comparison' ? (
                  <ComparisonTableApproval
                    props={{
                      dataOld: section.dataOld,
                      dataNew: section.dataNew,
                      oldKey: section.oldKey,
                      newKey: section.newKey,
                      height: 360,
                    }}
                  />
                ) : (
                  <Table<GenericObject>
                    size="small"
                    loading={loading}
                    columns={section.columns}
                    dataSource={section.rows}
                    pagination={false}
                    rowKey={(_, rowIndex) => `${section.key}-${rowIndex ?? 0}`}
                    scroll={{ x: 'max-content' }}
                    locale={{
                      emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No data" />,
                    }}
                  />
                )}
              </div>
            </Col>
          ))}
        </Row>
      )}
    </Card>
  );
}

export const ApprovalDetailSection = memo(ApprovalDetailSectionComponent) as typeof ApprovalDetailSectionComponent;

export default ApprovalDetailSection;
