import React from "react";
import { Typography } from "@webiny/ui/Typography";
import { getEntriesLabel } from "./SelectAll";
import { Button, MessageContainer } from "./SelectAll.styled";

export interface MessagesProps {
    onClick: () => void;
    selected: number;
}

export const SelectAllMessage = (props: MessagesProps) => {
    return (
        <MessageContainer>
            <Typography use={"body1"}>{`${getEntriesLabel(props.selected)} selected.`}</Typography>
            <Button small={true} onClick={props.onClick}>{`Select all remaining items`}</Button>
        </MessageContainer>
    );
};

export const ClearSelectionMessage = (props: MessagesProps) => {
    return (
        <MessageContainer>
            <Typography use={"body1"}>{`All items are selected.`}</Typography>
            <Button small={true} onClick={props.onClick}>{`Clear selection`}</Button>
        </MessageContainer>
    );
};
