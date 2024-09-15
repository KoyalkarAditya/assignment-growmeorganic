import { useState, useEffect, useCallback, useRef } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Paginator, PaginatorPageChangeEvent } from "primereact/paginator";
import { Checkbox } from "primereact/checkbox";
import { OverlayPanel } from "primereact/overlaypanel";
import { InputNumber } from "primereact/inputnumber";
import { Button } from "primereact/button";

type Artwork = {
  id: string;
  title: string;
  place_of_origin: string;
  artist_display: string;
  inscriptions: string;
  date_start: string;
  date_end: string;
};

type Pagination = {
  current_page: number;
  total_pages: number;
  limit: number;
};
type StateType = {
  countSelected: number;
  allSelected: boolean;
  states: Record<string, CheckBoxType>;
};
type CheckBoxType = Record<string, boolean>;

function App() {
  const [pagination, setPagination] = useState<Pagination>({
    current_page: 1,
    total_pages: 0,
    limit: 12,
  });

  const [data, setData] = useState<Artwork[]>([]);
  const [selectedCount, setSelectedCount] = useState(0);
  const [selectMultiple, setSelectMultiple] = useState<number>(1);
  const overlayPanelRef = useRef<OverlayPanel>(null);

  const [boxStates, setBoxStates] = useState<StateType>({
    countSelected: 0,
    allSelected: false,
    states: {},
  });

  useEffect(() => {
    const fetchData = async () => {
      const response = await fetch(
        `https://api.artic.edu/api/v1/artworks?page=${pagination.current_page}`
      );
      const json = await response.json();
      setData(json.data);
      setPagination({
        ...pagination,
        limit: json.pagination.limit,
        total_pages: json.pagination.total_pages,
        current_page: json.pagination.current_page,
      });
    };
    fetchData();
  }, [pagination.current_page]);

  useEffect(() => {
    setIsAllSelected();
  }, [data, boxStates]);

  const setIsAllSelected = useCallback(() => {
    const currentPageState = boxStates.states[pagination.current_page] || {};
    const isAllSelected = data.every((item) => currentPageState[item.id]);
    setBoxStates((prev) => ({ ...prev, allSelected: isAllSelected }));
  }, [data, pagination.current_page, boxStates.states]);

  const onPageChange = (event: PaginatorPageChangeEvent) => {
    setPagination({ ...pagination, current_page: event.page + 1 });
  };

  const onCheckboxChange = useCallback(
    (e: any, id: string) => {
      const checked = e.checked;
      const currentPageState = boxStates.states[pagination.current_page] || {};
      const updatedPageState = { ...currentPageState, [id]: checked };

      setBoxStates((prev) => ({
        ...prev,
        states: { ...prev.states, [pagination.current_page]: updatedPageState },
      }));

      setIsAllSelected();
    },
    [boxStates.states, pagination.current_page, setIsAllSelected]
  );

  const onSelectAllChange = (e: any) => {
    const checked = e.checked;
    const updatedState = data.reduce(
      (acc, item) => ({ ...acc, [item.id]: checked }),
      {}
    );

    setBoxStates((prev) => ({
      ...prev,
      states: { ...prev.states, [pagination.current_page]: updatedState },
      allSelected: checked,
    }));
  };

  const onSvgClick = (event: any) => {
    overlayPanelRef.current?.toggle(event);
  };

  const applySelectMultiple = () => {
    const allIds = data.slice(0, selectMultiple).map((item) => item.id);
    const updatedState = allIds.reduce(
      (acc, id) => ({ ...acc, [id]: true }),
      {}
    );

    setBoxStates((prev) => ({
      ...prev,
      states: {
        ...prev.states,
        [pagination.current_page]: {
          ...(prev.states[pagination.current_page] || {}),
          ...updatedState,
        },
      },
    }));
    overlayPanelRef.current?.hide();
  };

  return (
    <div className="card">
      <OverlayPanel ref={overlayPanelRef}>
        <div className="p-3">
          <h5>Select Multiple Artworks</h5>
          <InputNumber
            value={selectMultiple}
            onValueChange={(e) => setSelectMultiple(e.value || 1)}
            min={1}
            max={data.length}
          />
          <Button label="Apply" onClick={applySelectMultiple} />
        </div>
      </OverlayPanel>

      <DataTable value={data} tableStyle={{ minWidth: "50rem" }}>
        <Column
          header={
            <>
              <Checkbox
                onChange={onSelectAllChange}
                checked={boxStates.allSelected}
              />
              <svg
                onClick={onSvgClick}
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 384 512"
                style={{ cursor: "pointer", marginLeft: "0.5rem" }}
                width="20"
                height="20"
              >
                <path d="M169.4 470.6c12.5 12.5 32.8 12.5 45.3 0l160-160c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L224 370.8 224 64c0-17.7-14.3-32-32-32s-32 14.3-32 32l0 306.7L54.6 265.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l160 160z" />
              </svg>
            </>
          }
          body={(rowData: Artwork) => (
            <Checkbox
              onChange={(e) => onCheckboxChange(e, rowData.id)}
              checked={
                boxStates.states[pagination.current_page]?.[rowData.id] || false
              }
            />
          )}
        />
        <Column field="title" header="Title"></Column>
        <Column field="place_of_origin" header="Place Of Origin"></Column>
        <Column field="artist_display" header="Artist Display"></Column>
        <Column field="inscriptions" header="Inscriptions"></Column>
        <Column field="date_start" header="Date Start"></Column>
        <Column field="date_end" header="Date End"></Column>
      </DataTable>

      <Paginator
        first={(pagination.current_page - 1) * pagination.limit}
        rows={pagination.limit}
        totalRecords={pagination.total_pages * pagination.limit}
        onPageChange={onPageChange}
      />
    </div>
  );
}

export default App;
