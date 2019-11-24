import { createSlice, createSelector } from '@reduxjs/toolkit';
import api from '../../api';

export const FilterTypes = {
  NONE: 'NONE',
  ONLY_DIRTY: 'ONLY_DIRTY',
  ONLY_CLEAN: 'ONLY_CLEAN',
};

export const initialState = {
  isLoading: false,
  error: null,
  data: {
    byId: {},
    allIds: [],
  },
  filter: FilterTypes.NONE,
};

const documentsSlice = createSlice({
  name: 'documents',
  initialState,
  reducers: {
    setFilter(state, action) {
      const { filter } = action.payload;

      if (Object.values(FilterTypes).includes(filter)) {
        state.filter = filter;
      }
    },
    addDocumentStart(state, action) {
      state.isLoading = true;
      state.error = null;
    },
    addDocumentSuccess(state, action) {
      const {
        id,
        title,
        createdAt,
        updatedAt,
        content,
        author,
        isDirty,
      } = action.payload;

      if (!state.data.allIds.includes(id)) {
        state.data.allIds.push(id);
      }

      state.data.byId[id] = {
        id,
        title,
        createdAt,
        updatedAt,
        content,
        author,
        isDirty,
      };
      state.isLoading = false;
      state.error = null;
    },
    addDocumentFailure(state, action) {
      const { error } = action.payload;

      state.error = error;
      state.isLoading = false;
    },
    editDocument(state, action) {
      const { id, updatedAt, ...rest } = action.payload;

      Object.assign(state.data.byId[id], {
        ...rest,
        updatedAt,
        isDirty: true,
      });
    },
    syncDocumentsStart(state, action) {
      state.isLoading = true;
      state.error = null;
    },
    syncDocumentsSuccess(state, action) {
      const { documents } = action.payload;

      documents.forEach(doc => {
        const { id } = doc;

        Object.assign(state.data.byId[id], {
          isDirty: false,
        });
      });

      state.isLoading = false;
      state.error = null;
    },
    syncDocumentsFailure(state, action) {
      const { error } = action.payload;

      state.error = error;
      state.isLoading = false;
    },
  },
});

export const {
  addDocumentStart,
  addDocumentSuccess,
  addDocumentFailure,
  editDocument,
  setFilter,
  syncDocumentsStart,
  syncDocumentsSuccess,
  syncDocumentsFailure,
} = documentsSlice.actions;

export default documentsSlice.reducer;

export const addDocument = ({ title, content, author }) => async dispatch => {
  dispatch(addDocumentStart());
  try {
    const document = await api.addDocument({ title, content, author });
    dispatch(addDocumentSuccess(document));
  } catch (error) {
    dispatch(addDocumentFailure({ error }));
  }
};

export const syncDirtyDocuments = () => async (dispatch, getState) => {
  const dirtyDocuments = selectOnlyDirtyDocuments(getState());

  dispatch(syncDocumentsStart());
  try {
    const documents = await api.syncDocuments(dirtyDocuments);
    dispatch(syncDocumentsSuccess({ documents }));
  } catch (error) {
    dispatch(syncDocumentsFailure({ error }));
  }
};

const selectAllIds = state => state.documents.data.allIds;

const selectDocumentsById = state => state.documents.data.byId;

export const selectIsLoading = state => state.documents.isLoading;

export const selectError = state =>
  state.documents.error && state.documents.error.message;

export const selectFilter = state => state.documents.filter;

export const selectDocument = state => id => state.documents.data.byId[id];

export const selectAllDocuments = createSelector(
  [selectAllIds, selectDocumentsById],
  (allIds, byId) =>
    allIds.reduce((acc, id) => (byId[id] ? acc.concat(byId[id]) : acc), [])
);

export const selectAllDocumentsCount = createSelector(
  [selectAllIds],
  allIds => allIds.length
);

export const selectFilteredDocuments = createSelector(
  [selectAllDocuments, selectFilter],
  (documents, filter) =>
    filter === FilterTypes.NONE
      ? documents
      : documents.filter(({ isDirty }) =>
          filter === FilterTypes.ONLY_DIRTY
            ? isDirty === true
            : isDirty === false
        )
);

export const selectFilteredDocumentsCount = createSelector(
  [selectFilteredDocuments],
  documents => documents.length
);

export const selectOnlyDirtyDocuments = createSelector(
  [selectAllDocuments],
  documents => documents.filter(({ isDirty }) => isDirty === true)
);

export const selectOnlyDirtyDocumentsCount = createSelector(
  [selectOnlyDirtyDocuments],
  documents => documents.length
);
